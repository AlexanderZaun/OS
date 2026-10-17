import { app, BrowserWindow, ipcMain, protocol, net, dialog, shell } from 'electron';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Projects } from '../../core/project/service';
import { Extensions } from '../storage-files/extensions';
import { RecoveryStore } from '../storage-files/recovery';
import { ProjectSession } from '../../app/bootstrap/project-session';
import {CloseCoordinator} from '../../app/bootstrap/close-coordinator';
import type {CloseChoice,WindowCloseState} from '../../contracts/close';
import { validateCommand, validateProject } from '../validation-ajv/project';
import { validateEffectDefinition } from '../validation-ajv/effect';
import { textEffect } from '../../modules/effects/text/src/register';
import { fogEffect } from '../../modules/effects/fog/src/model';
import { starsEffect } from '../../modules/effects/stars/src/model';
import { networkEffect } from '../../modules/effects/network/src/model';
import {Playback} from '../../core/scene/playback';
import {createCloudNetwork} from '../../modules/presets/cloud-network/create';
import type { Effect, Manifest } from '../../sdk';
import type { Project } from '../../contracts/project';
protocol.registerSchemesAsPrivileged([{scheme:'studio',privileges:{standard:true,secure:true,supportFetchAPI:true,corsEnabled:true,stream:true}}]);
if(process.env.ALERT_STUDIO_DATA) app.setPath('userData',path.resolve(process.env.ALERT_STUDIO_DATA));
const effects:Effect[]=[textEffect,fogEffect,starsEffect,networkEffect]; const projects=new Projects(()=>effects);
let extensions:Extensions; let active:Manifest[]=[]; let session:ProjectSession;
const windows=new Set<BrowserWindow>();
const playback=new Playback();
function broadcastPlayback(){const state=playback.snapshot();for(const w of windows)w.webContents.send('playback:changed',state);return state;}
let shutdownComplete = false;
let projectActionBusy=false,queuedCloseOwner:BrowserWindow|undefined;
let mainWindow:BrowserWindow|undefined,closeOwner:BrowserWindow|undefined;
const closing=new CloseCoordinator({
  current:()=>({dirty:projects.snapshot().dirty,name:projects.snapshot().project.name,folder:session.status().folder}),
  save:async()=>Boolean(await saveProject(false,closeOwner)),
  finish:discard=>session.dispose(discard),
  quit:()=>{shutdownComplete=true;app.quit();},
  changed:()=>{for(const w of windows)if(!w.isDestroyed()&&!w.webContents.isDestroyed())w.webContents.send('app:close-changed',closeStateFor(w));},
});
function closeStateFor(w:BrowserWindow):WindowCloseState{const state=closing.snapshot();return state?{...state,owner:w===closeOwner}:null;}
function requestClose(owner?:BrowserWindow){
  if(closing.pending||!session)return;
  if(session.busy||projectActionBusy){queuedCloseOwner=owner??mainWindow??[...windows][0];return;}
  closeOwner=owner??mainWindow??[...windows][0];closeOwner?.focus();void closing.request();
}
async function projectAction<T>(action:()=>Promise<T>){
  if(projectActionBusy||session.busy)throw Error('projectOperationBusy');
  projectActionBusy=true;
  try{return await action();}finally{
    projectActionBusy=false;
    if(queuedCloseOwner){const owner=queuedCloseOwner;queuedCloseOwner=undefined;requestClose(owner.isDestroyed()?undefined:owner);}
  }
}
async function saveProject(as=false,parent?:BrowserWindow){
  if(session.busy)throw Error('projectOperationBusy');
  let folder=session.status().folder;
  if(!folder||as){
    const options={properties:['openDirectory','createDirectory'] as ('openDirectory'|'createDirectory')[],title:'Project folder'};
    const selected=parent?await dialog.showOpenDialog(parent,options):await dialog.showOpenDialog(options);
    if(selected.canceled||!selected.filePaths[0])return null;folder=selected.filePaths[0];
  }
  await session.save(folder);broadcast();return folder;
}
function broadcast(){const state=projects.snapshot();for(const w of windows)w.webContents.send('project:changed',state);return state;}
function windowFor(panel?:string) {
  const w=new BrowserWindow({width:panel?650:1440,height:panel?750:940,minWidth:500,minHeight:400,show:false,backgroundColor:'#0d111a',autoHideMenuBar:true,title:'AlertStudio',webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
  windows.add(w); w.once('ready-to-show',()=>w.show());
  if(!panel)mainWindow=w;
  w.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  w.webContents.on('will-navigate',(e,url)=>{if(!url.startsWith('studio://app/'))e.preventDefault();});
  w.on('close',e=>{
    if(shutdownComplete)return;
    if(closing.pending){e.preventDefault();return;}
    if(!panel||windows.size===1){e.preventDefault();requestClose(w);}
  });
  w.on('closed',()=>windows.delete(w));
  void w.loadURL(`studio://app/index.html${panel?'?panel='+encodeURIComponent(panel):''}`); return w;
}
function handle(channel:string,action:(...args:any[])=>unknown,withWindow=false){ipcMain.handle(channel,(event,...args)=>{
  const w=[...windows].find(w=>w.webContents===event.sender);
  if(!w||event.senderFrame!==event.sender.mainFrame||!event.senderFrame.url.startsWith('studio://app/'))throw Error('Invalid IPC sender');
  if(closing.pending&&!['app:close-state','app:close-response','project:snapshot','session:status','playback:snapshot','recovery:list','extensions:list','effects:define'].includes(channel))throw Error('projectOperationBusy');
  return withWindow?action(w,...args):action(...args);
});}
async function confirmReplace(){if(!projects.snapshot().dirty)return true;return (await dialog.showMessageBox({type:'warning',message:'Несохранённые изменения будут потеряны / Discard unsaved changes?',buttons:['Отмена / Cancel','Продолжить / Continue'],defaultId:0,cancelId:0})).response===1;}
app.whenReady().then(async()=>{
  if(!app.requestSingleInstanceLock()) { app.quit(); return; }
  app.on('second-instance',()=>{const first=[...windows][0];first?.restore();first?.focus();});
  session = new ProjectSession(projects, new RecoveryStore(path.join(app.getPath('userData'),'Recovery')), () => {
    for(const w of windows) w.webContents.send('session:changed',session.status());
  });
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
  handle('app:close-state',(w:BrowserWindow)=>closeStateFor(w),true);
  handle('app:close-response',(w:BrowserWindow,id:number,choice:CloseChoice)=>{if(w!==closeOwner)throw Error('Invalid close owner');return closing.respond(id,choice);},true);
  handle('project:preset',(id:string,language:string)=>projectAction(async()=>{
    if(id!=='cloud-network'||!['ru','en'].includes(language))throw Error('Invalid preset');
    if(session.busy||!await confirmReplace())return false;
    await session.create(validateProject(createCloudNetwork(effects,()=>crypto.randomUUID(),language as 'ru'|'en')));
    playback.reset();broadcastPlayback();broadcast();return true;
  }));
  handle('playback:snapshot',()=>playback.snapshot());
  handle('playback:command',raw=>{playback.dispatch(raw);return broadcastPlayback();});
  handle('project:command',raw=>{if(session.busy||projectActionBusy)throw Error('projectOperationBusy'); projects.dispatch(validateCommand(raw));session.changed();return broadcast();});
  handle('session:status',()=>session.status());
  handle('recovery:list',()=>session.recovery.list());
  handle('recovery:dismiss',async(id:string)=>{if(typeof id!=='string')throw Error('Invalid recovery ID');await session.dismissDraft(id);});
  handle('recovery:restore',(id:string)=>projectAction(async()=>{if(session.busy||!await confirmReplace())return false;if(typeof id!=='string')throw Error('Invalid recovery ID');await session.restore(id);playback.reset();broadcastPlayback();broadcast();return true;}));
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
  handle('project:save',(as:boolean)=>projectAction(()=>saveProject(as)));
  handle('project:open',()=>projectAction(async()=>{if(session.busy||!await confirmReplace())return false;const result=await dialog.showOpenDialog({properties:['openDirectory'],title:'Open project folder'});if(result.canceled)return false;await session.open(result.filePaths[0]);playback.reset();broadcastPlayback();broadcast();return true;}));
  handle('project:create',(options:Pick<Project,'name'|'width'|'height'|'background'>)=>projectAction(async()=>{if(session.busy||!await confirmReplace())return false;const p=validateProject({...projects.snapshot().project,...options,id:crypto.randomUUID(),objects:[],modules:{},format:1});await session.create(p);playback.reset();broadcastPlayback();broadcast();return true;}));
  handle('window:panel',(panel:string)=>{if(!['layers','properties','canvas',...active.filter(m=>m.kind==='panel').map(m=>m.id)].includes(panel))throw Error('Unknown panel');windowFor(panel);});
  windowFor();
});
app.on('window-all-closed',()=>app.quit());
app.on('before-quit',event=>{
  if(shutdownComplete || !session)return;
  event.preventDefault();
  requestClose();
});
