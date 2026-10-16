import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Project, StorageAdapter, SceneObject } from '../../contracts/project';
import { validateProject } from '../validation-ajv/project';
export class Files implements StorageAdapter {
  // Immutable revision tree + one authoritative index. Interrupted unreferenced revisions are never opened.
  constructor(private fault?:(file:string)=>void) {}
  async save(folder:string,project:Project) {
    validateProject(project);
    const revision=randomUUID(), base=`revisions/${revision}`;
    async function write(file:string,data:unknown) { const target=path.join(folder,file); await fs.mkdir(path.dirname(target),{recursive:true}); await fs.writeFile(target,JSON.stringify(data,null,2)); }
    for(const object of project.objects) {
      const {settings,...metadata}=object;
      const objectPath=`${base}/scenes/main/objects/${object.id}`;
      await write(`${objectPath}/object.json`,{...metadata,settingIds:Object.keys(settings)});
      for(const [key,value] of Object.entries(settings)) { const file=`${objectPath}/settings/${key}.json`; this.fault?.(file); await write(file,{value}); }
    }
    await write(`${base}/scenes/main/scene.json`,{objects:project.objects.map(o=>o.id)});
    for(const key of ['width','height','background'] as const) await write(`${base}/scenes/main/settings/${key}.json`,{value:project[key]});
    await write(`${base}/modules.lock.json`,{modules:project.modules,sdk:'0.1'});
    this.fault?.('before-index');
    await write('project.json.tmp',{id:project.id,name:project.name,format:1,revision,scene:`${base}/scenes/main/scene.json`});
    await fs.rename(path.join(folder,'project.json.tmp'),path.join(folder,'project.json'));
  }
  async open(folder:string):Promise<Project> {
    const root=await fs.realpath(folder);
    async function read(file:string):Promise<any> {
      if(file.includes('..')||path.isAbsolute(file)) throw Error('Unsafe project path');
      const target=await fs.realpath(path.join(root,file)); if(!target.startsWith(root+path.sep)) throw Error('Escaping project reference');
      if((await fs.stat(target)).size>2_000_000) throw Error('Project file too large');
      return JSON.parse(await fs.readFile(target,'utf8'));
    }
    const index=await read('project.json');
    if(index.format!==1||typeof index.revision!=='string'||! /^[a-f0-9-]{36}$/.test(index.revision)) throw Error('Invalid project index');
    const base=`revisions/${index.revision}/scenes/main`;
    if(index.scene!==`${base}/scene.json`) throw Error('Invalid scene reference');
    const scene=await read(`${base}/scene.json`);
    if(!Array.isArray(scene.objects)||scene.objects.length>1000||new Set(scene.objects).size!==scene.objects.length) throw Error('Invalid object references');
    const objects:SceneObject[]=[];
    for(const id of scene.objects) {
      if(typeof id!=='string'||!/^[a-zA-Z0-9-]{1,80}$/.test(id)) throw Error('Unsafe ID');
      const {settingIds,...metadata}=await read(`${base}/objects/${id}/object.json`);
      if(metadata.id!==id||!Array.isArray(settingIds)||settingIds.length>1000||new Set(settingIds).size!==settingIds.length) throw Error('Invalid settings index');
      const settings:SceneObject['settings']={};
      for(const key of settingIds) { if(typeof key!=='string'||!/^[a-zA-Z][a-zA-Z0-9-]{0,63}$/.test(key)) throw Error('Unsafe setting ID'); settings[key]=(await read(`${base}/objects/${id}/settings/${key}.json`)).value; }
      objects.push({...metadata,settings});
    }
    const lock=await read(`revisions/${index.revision}/modules.lock.json`);if(lock.sdk!=='0.1')throw Error('Unsupported SDK lock');
    return validateProject({id:index.id,name:index.name,format:1,objects,modules:lock.modules,width:(await read(`${base}/settings/width.json`)).value,height:(await read(`${base}/settings/height.json`)).value,background:(await read(`${base}/settings/background.json`)).value});
  }
}
