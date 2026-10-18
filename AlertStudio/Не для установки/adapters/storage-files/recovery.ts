import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Project } from '../../contracts/project';
import type { RecoveryInfo } from '../../contracts/recovery';
import { Files } from './project';
import { replaceJson } from './durable-json';

export class RecoveryStore {
  constructor(readonly root: string, private files = new Files(),private portableRoot?:string) {}

  private folder(id: string) {
    if (!/^[a-zA-Z0-9-]{1,80}$/.test(id)) throw Error('Invalid recovery ID');
    return path.join(this.root, id);
  }

  async save(project: Project, origin: string | null): Promise<RecoveryInfo> {
    const folder = this.folder(project.id);
    await this.files.save(folder, project);
    const info: RecoveryInfo = {id: project.id, name: project.name, origin, updatedAt: new Date().toISOString()};
    const relative=origin&&this.portableRoot?path.relative(this.portableRoot,origin):null;
    const internal=relative!==null&&relative!==''&&!path.isAbsolute(relative)&&relative!=='..'&&!relative.startsWith('..'+path.sep);
    await replaceJson(path.join(folder, 'recovery.json'), {...info,...(internal?{origin:null,originRelative:relative.split(path.sep).join('/')}:{}) ,active: true});
    return info;
  }

  async list(): Promise<RecoveryInfo[]> {
    await fs.mkdir(this.root, {recursive: true});
    const found: RecoveryInfo[] = [];
    for (const entry of await fs.readdir(this.root, {withFileTypes: true})) {
      if (!entry.isDirectory() || entry.isSymbolicLink()) continue;
      try {
        const metadata = JSON.parse(await fs.readFile(path.join(this.folder(entry.name), 'recovery.json'), 'utf8'));
        if (metadata.active !== true || metadata.id !== entry.name || typeof metadata.name !== 'string' ||
          !Number.isFinite(Date.parse(metadata.updatedAt)) || (metadata.origin !== null && typeof metadata.origin !== 'string')) continue;
        let origin=metadata.origin;
        if(metadata.originRelative!==undefined){
          if(!this.portableRoot||typeof metadata.originRelative!=='string'||!metadata.originRelative||metadata.originRelative.includes('\\')||metadata.originRelative.split('/').some((part:string)=>!part||part==='.'||part==='..'||part.includes(':')))continue;
          origin=path.resolve(this.portableRoot,metadata.originRelative);const relative=path.relative(this.portableRoot,origin);if(path.isAbsolute(relative)||relative==='..'||relative.startsWith('..'+path.sep))continue;
        }
        found.push({id: metadata.id, name: metadata.name, origin, updatedAt: metadata.updatedAt});
      } catch (error) { console.warn('Skipped incomplete recovery metadata', entry.name, String(error)); }
    }
    return found.sort((a,b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async open(id: string): Promise<Project> {
    if (!(await this.list()).some(info => info.id === id)) throw Error('Recovery unavailable');
    const project = await this.files.open(this.folder(id));
    if (project.id !== id) throw Error('Recovery identity mismatch');
    return project;
  }

  async dismiss(id: string): Promise<void> {
    const folder = this.folder(id);
    const metadata = JSON.parse(await fs.readFile(path.join(folder, 'recovery.json'), 'utf8'));
    await replaceJson(path.join(folder, 'recovery.json'), {...metadata, active: false});
  }
}
