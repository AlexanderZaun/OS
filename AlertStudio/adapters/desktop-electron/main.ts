import { app, BrowserWindow, ipcMain, protocol, net, dialog, shell } from 'electron';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Projects } from '../../core/project/service';
import { Extensions } from '../storage-files/extensions';
import { Files } from '../storage-files/project';
import { validateCommand, validateProject } from '../validation-ajv/project';
import { validateEffectDefinition } from '../validation-ajv/effect';
import { textEffect } from '../../modules/effects/text/src/register';
import type { Effect, Manifest } from '../../sdk';
import type { Project } from '../../contracts/project';
protocol.registerSchemesAsPrivileged([{scheme:'studio',privileges:{standard:true,secure:true,supportFetchAPI:true,corsEnabled:true,stream:true}}]);
if(process.env.ALERT_STUDIO_DATA) app.setPath('userData',path.resolve(process.env.ALERT_STUDIO_DATA));
const effects:Effect[]=[textEffect]; const projects=new Projects(()=>effects); const storage=new Files();
let extensions:Extensions; let active:Manifest[]=[]; let projectFolder:string|undefined;
const windows=new Set<BrowserWindow>(); let saving=false;
function broadcast(){const state=projects.snapshot();for(const w of windows)w.webContents.send('project:changed',state);return state;}
function windowFor(panel?:string) {
  const w=new BrowserWindow({width:panel?650:1440,height:panel?750:940,minWidth:500,minHeight:400,show:false,backgroundColor:'#0d111a',autoHideMenuBar:true,title:'AlertStudio',webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
  windows.add(w); w.once('ready-to-show',()=>w.show());
  w.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  w.webContents.on('will-navigate',(e,url)=>{if(!url.startsWith('studio://app/'))e.preventDefault();});
  w.on('close',e=>{ if(windows.size===1&&projects.snapshot().dirty){const choice=dialog.showMessageBoxSync(w,{type:'warning',message:'Есть несохранённые изменения / Unsaved changes',buttons:['Отмена / Cancel','Закрыть / Discard'],defaultId:0,cancelId:0});if(choice===0)e.preventDefault();} });
  w.on('closed',()=>windows.delete(w));
  void w.loadURL(`studio://app/index.html${panel?'?panel='+encodeURIComponent(panel):''}`); return w;
}
function handle(channel:string,action:(...args:any[])=>unknown){ipcMain.handle(channel,(event,...args)=>{
  if(![...windows].some(w=>w.webContents===event.sender)||event.senderFrame!==event.sender.mainFrame||!event.senderFrame.url.startsWith('studio://app/'))throw Error('Invalid IPC sender');
  return action(...args);
});}
async function confirmReplace(){if(!projects.snapshot().dirty)return true;return (await dialog.showMessageBox({type:'warning',message:'Несохранённые изменения будут потеряны / Discard unsaved changes?',buttons:['Отмена / Cancel','Продолжить / Continue'],defaultId:0,cancelId:0})).response===1;}
app.whenReady().then(async()=>{
  extensions=new Extensions(path.join(app.getPath('userData'),'Extensions'));
  if(!process.argv.includes('--safe')) { try{active=await extensions.list();}catch(error){console.error('Extensions disabled:',error);} }
  protocol.handle('studio',async request=>{
    try {
      const url=new URL(request.url); const relative=decodeURIComponent(url.pathname.slice(1));
      if(url.hostname==='app') {
        if(relative.includes('..')||relative.includes('\\')||! /^[a-zA-Z0-9_./-]+$/.test(relative))return new Response('',{status:403});
        return net.fetch(pathToFileURL(path.join(__dirname,'../ui',relative)).href);
      }
      if(url.hostname==='extensions') {
        const [id,version,...rest]=relative.split('/'); const m=active.find(m=>m.id===id&&m.version===version);const file=rest.join('/');
        if(!m||!m.files[file])return new Response('',{status:404});
        const response=await net.fetch(pathToFileURL(extensions.file(m,file)).href);
        const types:Record<string,string>={'.js':'text/javascript','.json':'application/json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
        return new Response(await response.arrayBuffer(),{status:response.status,headers:{'Content-Type':types[path.extname(file)]??'application/octet-stream','Access-Control-Allow-Origin':'studio://app'}});
      }
    } catch(error){console.error(error);} return new Response('',{status:404});
  });
  handle('project:snapshot',()=>projects.snapshot());
  handle('project:command',raw=>{if(saving)throw Error('Save in progress'); projects.dispatch(validateCommand(raw));return broadcast();});
  handle('extensions:list',()=>active.map(manifest=>({manifest,url:`studio://extensions/${manifest.id}/${manifest.version}/${manifest.entry}`})));
  handle('extensions:install',async()=>{const result=await dialog.showOpenDialog({properties:['openDirectory'],title:'Install trusted extension package'});if(result.canceled)return null; const m=await extensions.install(result.filePaths[0]);return m.id;});
  handle('extensions:folder',async()=>{await extensions.list(); await shell.openPath(extensions.root);});
  handle('effects:define',(raw:unknown)=>{
    const definition=validateEffectDefinition(raw);
    // Data only; external JavaScript is never executed in main.
    if(!definition||!active.some(m=>m.id===definition.id&&m.kind==='effect'&&m.version===definition.version))throw Error('Effect not installed');
    if(effects.some(e=>e.id===definition.id))return;
    effects.push({...structuredClone(definition),evaluate:()=>[]});
  });
  handle('project:save',async(as:boolean)=>{
    if(saving)throw Error('Save in progress'); saving=true;
    try{let folder=projectFolder;
      if(!folder||as){const selected=await dialog.showOpenDialog({properties:['openDirectory','createDirectory'],title:'Project folder'});if(selected.canceled)return null;folder=selected.filePaths[0];}
      await storage.save(folder,projects.snapshot().project);projectFolder=folder;projects.markSaved();broadcast();return folder;
    }finally{saving=false;}
  });
  handle('project:open',async()=>{if(saving||!await confirmReplace())return;const result=await dialog.showOpenDialog({properties:['openDirectory'],title:'Open project folder'});if(result.canceled)return;const project=await storage.open(result.filePaths[0]);projects.load(project);projectFolder=result.filePaths[0];broadcast();});
  handle('project:create',async(options:Pick<Project,'name'|'width'|'height'|'background'>)=>{if(saving||!await confirmReplace())return;const p=validateProject({...projects.snapshot().project,...options,id:crypto.randomUUID(),objects:[],modules:{},format:1});projects.load(p);projectFolder=undefined;broadcast();});
  handle('window:panel',(panel:string)=>{if(!['layers','properties','canvas',...active.filter(m=>m.kind==='panel').map(m=>m.id)].includes(panel))throw Error('Unknown panel');windowFor(panel);});
  windowFor();
});
app.on('window-all-closed',()=>app.quit());
