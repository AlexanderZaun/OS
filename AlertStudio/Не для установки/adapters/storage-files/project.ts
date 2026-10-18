import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Project, StorageAdapter, SceneObject } from '../../contracts/project';
import { validateProject } from '../validation-ajv/project';
import { writeJson, replaceJson } from './durable-json';
import {notificationKeys} from '../../core/notification/definitions';
import type {NotificationSettings} from '../../contracts/notification';
import {layerKeys} from '../../core/scene/layer-style';
import type {LayerStyle} from '../../contracts/layer';
import {layerEditorKeys} from '../../core/scene/layer-editor';
import type {LayerEditor} from '../../contracts/layer-editor';
interface ProjectIndex { id: string; name: string; format: 1; revision: string; scene: string; }
export interface OpenedProject { project: Project; usedBackup: boolean; index: ProjectIndex; }
export class Files implements StorageAdapter {
  // Immutable revision tree + one authoritative index. Interrupted unreferenced revisions are never opened.
  constructor(private fault?:(file:string)=>void) {}
  async save(folder:string,project:Project) {
    validateProject(project);
    await fs.mkdir(folder, { recursive: true });
    let previous: ProjectIndex | undefined;
    const exists = (file: string) => fs.stat(path.join(folder, file)).then(() => true, error => {
      if (error.code === 'ENOENT') return false;
      throw error;
    });
    const hasIndexes = await Promise.all([exists('project.json'), exists('project.previous.json')]);
    if (hasIndexes.some(Boolean)) previous = (await this.openDetailed(folder)).index;
    if (previous && previous.id !== project.id) throw Error('projectFolderContainsOtherProject');
    const revision=randomUUID(), base=`revisions/${revision}`;
    async function write(file:string,data:unknown) { await writeJson(path.join(folder,file),data); }
    for(const object of project.objects) {
      const {settings,layer,editor,...metadata}=object;
      const objectPath=`${base}/scenes/main/objects/${object.id}`;
      await write(`${objectPath}/object.json`,{...metadata,settingIds:Object.keys(settings),...(layer?{layer:1}:{}),...(editor?{editor:1}:{})});
      if(editor)for(const key of layerEditorKeys)await write(`${objectPath}/editor/settings/${key}.json`,{value:editor[key]});
      if(layer)for(const key of layerKeys)await write(`${objectPath}/layer/settings/${key}.json`,{value:layer[key]});
      this.fault?.('after-object-metadata');
      for(const [key,value] of Object.entries(settings)) { const file=`${objectPath}/settings/${key}.json`; this.fault?.(file); await write(file,{value}); }
    }
    await write(`${base}/scenes/main/scene.json`,{objects:project.objects.map(o=>o.id),...(project.notification?{notification:1}:{})});
    if(project.notification)for(const key of notificationKeys)await write(`${base}/scenes/main/notification/settings/${key}.json`,{value:project.notification[key]});
    for(const key of ['width','height','background'] as const) await write(`${base}/scenes/main/settings/${key}.json`,{value:project[key]});
    await write(`${base}/modules.lock.json`,{modules:project.modules,sdk:'0.1'});
    const index: ProjectIndex = {id:project.id,name:project.name,format:1,revision,scene:`${base}/scenes/main/scene.json`};
    // Backup references a fully validated previous tree; an interrupted Save
    // never changes that tree. A first Save can recover its fully written tree.
    await replaceJson(path.join(folder,'project.previous.json'),previous ?? index);
    this.fault?.('after-backup');
    this.fault?.('before-index');
    await replaceJson(path.join(folder,'project.json'),index);
  }
  async open(folder:string):Promise<Project> {
    return (await this.openDetailed(folder)).project;
  }
  async openDetailed(folder: string): Promise<OpenedProject> {
    try {
      return {...await this.readRevision(folder, 'project.json'), usedBackup: false};
    } catch (primaryError) {
      try {
        return {...await this.readRevision(folder, 'project.previous.json'), usedBackup: true};
      } catch (backupError) {
        throw new AggregateError([primaryError, backupError], 'projectUnreadable');
      }
    }
  }
  private async readRevision(folder: string, indexFile: string): Promise<{project: Project; index: ProjectIndex}> {
    const root=await fs.realpath(folder);
    async function read(file:string):Promise<any> {
      if(file.includes('..')||path.isAbsolute(file)) throw Error('Unsafe project path');
      const target=await fs.realpath(path.join(root,file)); if(!target.startsWith(root+path.sep)) throw Error('Escaping project reference');
      if((await fs.stat(target)).size>2_000_000) throw Error('Project file too large');
      return JSON.parse(await fs.readFile(target,'utf8'));
    }
    const index=await read(indexFile);
    if(index.format!==1||typeof index.revision!=='string'||! /^[a-f0-9-]{36}$/.test(index.revision)) throw Error('Invalid project index');
    const base=`revisions/${index.revision}/scenes/main`;
    if(index.scene!==`${base}/scene.json`) throw Error('Invalid scene reference');
    const scene=await read(`${base}/scene.json`);
    if(!Array.isArray(scene.objects)||scene.objects.length>1000||new Set(scene.objects).size!==scene.objects.length) throw Error('Invalid object references');
    const objects:SceneObject[]=[];
    for(const id of scene.objects) {
      if(typeof id!=='string'||!/^[a-zA-Z0-9-]{1,80}$/.test(id)) throw Error('Unsafe ID');
      const {settingIds,layer:layerVersion,editor:editorVersion,...metadata}=await read(`${base}/objects/${id}/object.json`);
      if(metadata.id!==id||!Array.isArray(settingIds)||settingIds.length>1000||new Set(settingIds).size!==settingIds.length) throw Error('Invalid settings index');
      const settings:SceneObject['settings']={};
      for(const key of settingIds) { if(typeof key!=='string'||!/^[a-zA-Z][a-zA-Z0-9-]{0,63}$/.test(key)) throw Error('Unsafe setting ID'); settings[key]=(await read(`${base}/objects/${id}/settings/${key}.json`)).value; }
      let layer:LayerStyle|undefined;
      if(layerVersion!==undefined){
        if(layerVersion!==1)throw Error('Unsupported layer format');
        layer={version:1,...Object.fromEntries(await Promise.all(layerKeys.map(async key=>[key,(await read(`${base}/objects/${id}/layer/settings/${key}.json`)).value])))} as unknown as LayerStyle;
      }
      let editor:LayerEditor|undefined;
      if(editorVersion!==undefined){
        if(editorVersion!==1)throw Error('Unsupported layer editor format');
        editor={version:1,...Object.fromEntries(await Promise.all(layerEditorKeys.map(async key=>[key,(await read(`${base}/objects/${id}/editor/settings/${key}.json`)).value])))} as unknown as LayerEditor;
      }
      objects.push({...metadata,settings,...(layer?{layer}:{}),...(editor?{editor}:{})});
    }
    const lock=await read(`revisions/${index.revision}/modules.lock.json`);if(lock.sdk!=='0.1')throw Error('Unsupported SDK lock');
    let notification:NotificationSettings|undefined;
    if(scene.notification!==undefined){
      if(scene.notification!==1)throw Error('Unsupported notification format');
      notification={version:1,...Object.fromEntries(await Promise.all(notificationKeys.map(async key=>[key,(await read(`${base}/notification/settings/${key}.json`)).value])))} as unknown as NotificationSettings;
    }
    const project = validateProject({id:index.id,name:index.name,format:1,objects,modules:lock.modules,width:(await read(`${base}/settings/width.json`)).value,height:(await read(`${base}/settings/height.json`)).value,background:(await read(`${base}/settings/background.json`)).value,...(notification?{notification}:{})});
    return {project, index};
  }
}
