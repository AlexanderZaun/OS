import path from 'node:path';
import {mkdirSync,writeFileSync,unlinkSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
export function portablePaths(executable:string){
  const root=path.dirname(path.resolve(executable)),data=path.join(root,'Data');
  return {root,data,profile:path.join(data,'Profile'),projects:path.join(data,'Projects'),recovery:path.join(data,'Recovery'),extensions:path.join(data,'Extensions'),logs:path.join(data,'Logs'),crashes:path.join(data,'CrashDumps')};
}
export function preparePortable(executable:string){
  const paths=portablePaths(executable);
  for(const folder of [paths.profile,paths.projects,paths.recovery,paths.extensions,paths.logs,paths.crashes])mkdirSync(folder,{recursive:true});
  const probe=path.join(paths.data,`.write-check-${randomUUID()}`);
  try{writeFileSync(probe,'',{flag:'wx'});}finally{try{unlinkSync(probe);}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}}
  return paths;
}
export function portableProjectFolder(projects:string,name:string,id:string){
  if(!/^[a-zA-Z0-9-]{1,80}$/.test(id))throw Error('Invalid project ID');
  const safe=name.replace(/[<>:"/\\|?*\x00-\x1f]/g,'_').replace(/[. ]+$/g,'').slice(0,70)||'Project';
  return path.join(projects,`${safe}-${id}`);
}
