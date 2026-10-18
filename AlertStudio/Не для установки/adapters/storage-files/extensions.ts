import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { validateManifest, safeRelative } from '../validation-ajv/manifest';
import { orderModules } from '../../core/modules/order';
import type { Manifest } from '../../sdk';
export async function validatePackage(folder:string):Promise<Manifest> {
  const root=await fs.realpath(folder);
  const manifestPath=path.join(root,'manifest.json');
  if((await fs.lstat(manifestPath)).isSymbolicLink()) throw Error('Manifest symlink rejected');
  if((await fs.stat(manifestPath)).size>100_000) throw Error('Manifest too large');
  const manifest=validateManifest(JSON.parse(await fs.readFile(manifestPath,'utf8')));
  if(!manifest.files[manifest.entry]) throw Error('Entry must be in inventory');
  let total=0;
  for(const [file,hash] of Object.entries(manifest.files)) {
    safeRelative(file);
    const target=path.join(root,file); const canonical=await fs.realpath(target);
    if(!canonical.startsWith(root+path.sep) || (await fs.lstat(target)).isSymbolicLink()) throw Error('Escaping path or symlink');
    const stat=await fs.stat(target); total+=stat.size;
    if(!stat.isFile() || total>20_000_000) throw Error('Invalid package size');
    const data=await fs.readFile(target);
    if(createHash('sha256').update(data).digest('hex')!==hash) throw Error(`Digest mismatch: ${file}`);
  }
  return manifest;
}
export class Extensions {
  constructor(readonly root:string) {}
  async list():Promise<Manifest[]> {
    await fs.mkdir(path.join(this.root,'installed'),{recursive:true});
    const result:Manifest[]=[];
    for(const item of await fs.readdir(path.join(this.root,'installed'),{withFileTypes:true})) {
      if(!item.isDirectory() || item.isSymbolicLink()) continue;
      const folder=path.join(this.root,'installed',item.name);
      let ready:{version:string};
      try {ready=JSON.parse(await fs.readFile(path.join(folder,'ready.json'),'utf8'));} catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')continue;throw error;}
      if(!/^\d+\.\d+\.\d+$/.test(ready.version) || !/^[a-z][a-z0-9-]{0,63}$/.test(item.name)) throw Error('Invalid installed index');
      const m=await validatePackage(path.join(folder,ready.version));
      if(m.id!==item.name||m.version!==ready.version) throw Error('Installed identity mismatch');
      result.push(m);
    }
    return orderModules(result);
  }
  async install(source:string) {
    const m=await validatePackage(source);
    const current=await this.list();
    if(current.some(x=>x.id===m.id)) throw Error('This ID is installed. Updates are deferred to the next SDK checkpoint.');
    orderModules([...current,m]);
    const staging=path.join(this.root,'staging',randomUUID());
    await fs.mkdir(staging,{recursive:true});
    try {
      await fs.copyFile(path.join(source,'manifest.json'),path.join(staging,'manifest.json'));
      for(const file of Object.keys(m.files)) { const out=path.join(staging,safeRelative(file)); await fs.mkdir(path.dirname(out),{recursive:true}); await fs.copyFile(path.join(source,file),out); }
      await validatePackage(staging);
      const destination=path.join(this.root,'installed',m.id); await fs.mkdir(destination,{recursive:true});
      await fs.rename(staging,path.join(destination,m.version));
      await fs.writeFile(path.join(destination,'ready.json.tmp'),JSON.stringify({version:m.version}));
      await fs.rename(path.join(destination,'ready.json.tmp'),path.join(destination,'ready.json'));
      return m;
    } catch(error) { /* Incomplete staging is inert; retain for diagnosis. */ throw error; }
  }
  file(manifest:Manifest,relative:string) { return path.join(this.root,'installed',manifest.id,manifest.version,safeRelative(relative)); }
}
