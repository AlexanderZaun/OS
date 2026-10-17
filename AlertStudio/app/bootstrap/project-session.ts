import { promises as fs } from 'node:fs';
import type { Project } from '../../contracts/project';
import type { SessionStatus } from '../../contracts/recovery';
import { Projects } from '../../core/project/service';
import { Files } from '../../adapters/storage-files/project';
import { FolderLease } from '../../adapters/storage-files/folder-lease';
import { RecoveryStore } from '../../adapters/storage-files/recovery';

export class ProjectSession {
  busy = false;
  private lease: FolderLease | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private tail: Promise<void> = Promise.resolve();
  private latest: Promise<void> = Promise.resolve();
  private queuedKey: string | null = null;
  private observed: string;
  private epoch = 0;
  private state: SessionStatus = {autosave:'idle',savedAt:null,error:null,folder:null,usedBackup:false,recovered:false};

  constructor(
    readonly projects: Projects,
    readonly recovery: RecoveryStore,
    private notify: () => void,
    private files = new Files(),
    private debounceMs = 700,
  ) { this.observed = JSON.stringify(projects.snapshot().project); }

  status(): SessionStatus { return {...this.state}; }
  private update(patch: Partial<SessionStatus>) { this.state = {...this.state, ...patch}; this.notify(); }
  private cancelTimer() { if (this.timer) clearTimeout(this.timer); this.timer = undefined; }

  changed(): void {
    const snapshot = this.projects.snapshot();
    const signature = JSON.stringify(snapshot.project);
    if (signature === this.observed) return; // selection and playback are not edits
    this.observed = signature;
    this.scheduleDraft();
  }

  private scheduleDraft() {
    this.cancelTimer();
    if (!this.projects.snapshot().dirty) {
      const id = this.projects.snapshot().project.id;
      const epoch = this.epoch;
      this.tail = this.tail.then(() => this.dismissIfPresent(id)).catch(error => {
        if (epoch === this.epoch) this.update({autosave:'error',error:String(error)});
      });
      this.queuedKey = null;
      this.update({autosave:'idle',error:null});
      return;
    }
    this.update({autosave:'pending',error:null});
    this.timer = setTimeout(() => { this.timer = undefined; void this.enqueueDraft().catch(() => {}); }, this.debounceMs);
  }

  private enqueueDraft(): Promise<void> {
    const project = this.projects.snapshot().project;
    const key = JSON.stringify(project);
    if (key === this.queuedKey) return this.latest;
    this.queuedKey = key;
    const epoch = this.epoch;
    const origin = this.state.folder;
    const operation = this.tail.then(async () => {
      if (epoch === this.epoch) this.update({autosave:'saving',error:null});
      const info = await this.recovery.save(project, origin);
      if (epoch === this.epoch && key === JSON.stringify(this.projects.snapshot().project)) {
        this.update({autosave:'saved',savedAt:info.updatedAt,error:null});
      }
    });
    this.latest = operation;
    this.tail = operation.catch(error => {
      if (this.queuedKey === key) this.queuedKey = null;
      if (epoch === this.epoch) this.update({autosave:'error',error:String(error)});
    });
    return operation;
  }

  async flushDraft(): Promise<void> {
    this.cancelTimer();
    if (this.projects.snapshot().dirty) await this.enqueueDraft();
    await this.tail;
  }

  private async dismissIfPresent(id: string) {
    if ((await this.recovery.list()).some(info => info.id === id)) await this.recovery.dismiss(id);
  }

  async dismissDraft(id: string) {
    await this.tail;
    await this.recovery.dismiss(id);
  }

  private async exclusive<T>(action: () => Promise<T>): Promise<T> {
    if (this.busy) throw Error('projectOperationBusy');
    this.busy = true;
    try { return await action(); } finally { this.busy = false; }
  }

  private async acquire(folder: string): Promise<{lease: FolderLease; fresh: boolean}> {
    const canonical = await fs.realpath(folder);
    if (this.lease?.folder.toLowerCase() === canonical.toLowerCase()) return {lease:this.lease,fresh:false};
    return {lease:await FolderLease.acquire(canonical),fresh:true};
  }

  private async adopt(lease: FolderLease | null) {
    const previous = this.lease;
    if (previous && previous !== lease) await previous.release();
    this.lease = lease;
  }

  private loaded(project: Project, folder: string | null, usedBackup = false, recovered = false) {
    this.epoch++;
    this.queuedKey = null;
    this.projects.load(project, !usedBackup && !recovered && folder !== null);
    this.observed = JSON.stringify(project);
    this.state = {autosave:'idle',savedAt:null,error:null,folder,usedBackup,recovered};
    this.notify();
    if (this.projects.snapshot().dirty) this.scheduleDraft();
  }

  async create(project: Project) {
    return this.exclusive(async () => {
      await this.flushDraft();
      await this.adopt(null);
      this.loaded(project, null);
    });
  }

  async open(folder: string) {
    return this.exclusive(async () => {
      const acquired = await this.acquire(folder);
      try {
        const result = await this.files.openDetailed(acquired.lease.folder);
        await this.flushDraft();
        await this.adopt(acquired.lease);
        this.loaded(result.project, acquired.lease.folder, result.usedBackup);
      } catch (error) {
        if (acquired.fresh && this.lease !== acquired.lease) await acquired.lease.release();
        throw error;
      }
    });
  }

  async save(folder: string) {
    return this.exclusive(async () => {
      const acquired = await this.acquire(folder);
      this.cancelTimer();
      try {
        await this.tail;
        await this.files.save(acquired.lease.folder, this.projects.snapshot().project);
        await this.adopt(acquired.lease);
        this.projects.markSaved();
        this.epoch++;
        this.queuedKey = null;
        this.update({folder:acquired.lease.folder,autosave:'idle',savedAt:null,error:null,usedBackup:false,recovered:false});
        try { await this.dismissIfPresent(this.projects.snapshot().project.id); }
        catch (error) { this.update({autosave:'error',error:String(error)}); }
      } catch (error) {
        if (acquired.fresh && this.lease !== acquired.lease) await acquired.lease.release();
        this.scheduleDraft();
        throw error;
      }
    });
  }

  async restore(id: string) {
    return this.exclusive(async () => {
      await this.flushDraft();
      const project = await this.recovery.open(id);
      await this.adopt(null);
      // Restore into an unsaved document, never silently overwrite its origin.
      this.loaded(project, null, false, true);
    });
  }

  async dispose(discard=false) {
    return this.exclusive(async()=>{
      this.cancelTimer();
      try {
        if(discard){await this.tail;await this.dismissIfPresent(this.projects.snapshot().project.id);}
        else await this.flushDraft();
        await this.adopt(null);
      }catch(error){this.scheduleDraft();throw error;}
    });
  }
}
