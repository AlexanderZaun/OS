import { app, BrowserWindow, ipcMain, protocol, net, dialog, shell } from 'electron';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Projects } from '../../core/project/service';
import { Extensions } from '../storage-files/extensions';
import { RecoveryStore } from '../storage-files/recovery';
import { ProjectSession } from '../../app/bootstrap/project-session';
import { validateCommand, validateProject } from '../validation-ajv/project';
import { validateEffectDefinition } from '../validation-ajv/effect';
import { textEffect } from '../../modules/effects/text/src/register';
import type { Effect, Manifest } from '../../sdk';
import type { Project } from '../../contracts/project';
protocol.registerSchemesAsPrivileged([{scheme:'studio',privileges:{standard:true,secure:true,supportFetchAPI:true,corsEnabled:true,stream:true}}]);
if(process.env.ALERT_STUDIO_DATA) app.setPath('userData',path.resolve(process.env.ALERT_STUDIO_DATA));
const effects:Effect[]=[textEffect]; const projects=new Projects(()=>effects);
let extensions:Extensions; let active:Manifest[]=[]; let session:ProjectSession;
const windows=new Set<BrowserWindow>();
let quitting = false, shutdownComplete = false;
function broadcast(){const state=projects.snapshot();for(const w of windows)w.webContents.send('project:changed',state);return state;}
function windowFor(panel?:string) {
  const w=new BrowserWindow({width:panel?650:1440,height:panel?750:940,minWidth:500,minHeight:400,show:false,backgroundColor:'#0d111a',autoHideMenuBar:true,title:'AlertStudio',webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
  windows.add(w); w.once('ready-to-show',()=>w.show());
  w.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  w.webContents.on('will-navigate',(e,url)=>{if(!url.startsWith('studio://app/'))e.preventDefault();});
  w.on('close',e=>{
    if(session?.busy) { e.preventDefault(); return; }
    if(windows.size===1&&projects.snapshot().dirty&&!quitting){const choice=dialog.showMessageBoxSync(w,{type:'warning',message:'Изменения не сохранены в проект / Changes are not saved to the project',detail:'При закрытии останется отдельный черновик / A separate recovery draft will be kept.',buttons:['Отмена / Cancel','Закрыть с черновиком / Keep draft and close'],defaultId:0,cancelId:0});if(choice===0)e.preventDefault();}
  });
  w.on('closed',()=>windows.delete(w));
  void w.loadURL(`studio://app/index.html${panel?'?panel='+encodeURIComponent(panel):''}`); return w;
}
function handle(channel:string,action:(...args:any[])=>unknown){ipcMain.handle(channel,(event,...args)=>{
  if(![...windows].some(w=>w.webContents===event.sender)||event.senderFrame!==event.sender.mainFrame||!event.senderFrame.url.startsWith('studio://app/'))throw Error('Invalid IPC sender');
  return action(...args);
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
  handle('project:command',raw=>{if(session.busy)throw Error('projectOperationBusy'); projects.dispatch(validateCommand(raw));session.changed();return broadcast();});
  handle('session:status',()=>session.status());
  handle('recovery:list',()=>session.recovery.list());
  handle('recovery:dismiss',async(id:string)=>{if(typeof id!=='string')throw Error('Invalid recovery ID');await session.dismissDraft(id);});
  handle('recovery:restore',async(id:string)=>{if(session.busy||!await confirmReplace())return false;if(typeof id!=='string')throw Error('Invalid recovery ID');await session.restore(id);broadcast();return true;});
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
    if(session.busy)throw Error('projectOperationBusy');
    let folder=session.status().folder;
      if(!folder||as){const selected=await dialog.showOpenDialog({properties:['openDirectory','createDirectory'],title:'Project folder'});if(selected.canceled)return null;folder=selected.filePaths[0];}
      await session.save(folder);broadcast();return folder;
  });
  handle('project:open',async()=>{if(session.busy||!await confirmReplace())return false;const result=await dialog.showOpenDialog({properties:['openDirectory'],title:'Open project folder'});if(result.canceled)return false;await session.open(result.filePaths[0]);broadcast();return true;});
  handle('project:create',async(options:Pick<Project,'name'|'width'|'height'|'background'>)=>{if(session.busy||!await confirmReplace())return false;const p=validateProject({...projects.snapshot().project,...options,id:crypto.randomUUID(),objects:[],modules:{},format:1});await session.create(p);broadcast();return true;});
  handle('window:panel',(panel:string)=>{if(!['layers','properties','canvas',...active.filter(m=>m.kind==='panel').map(m=>m.id)].includes(panel))throw Error('Unknown panel');windowFor(panel);});
  windowFor();
});
app.on('window-all-closed',()=>app.quit());
app.on('before-quit',event=>{
  if(shutdownComplete || !session)return;
  event.preventDefault();
  if(session.busy)return;
  if(quitting)return;
  quitting=true;
  void session.dispose().then(()=>{shutdownComplete=true;app.quit();}).catch(error=>{
    quitting=false;
    console.error('Could not finish recovery draft',error);
    const choice=dialog.showMessageBoxSync({type:'error',message:'Не удалось сохранить черновик / Could not save recovery draft',detail:String(error),buttons:['Вернуться / Return','Выйти без нового черновика / Quit without new draft'],defaultId:0,cancelId:0});
    if(choice===1){shutdownComplete=true;app.quit();}else if(windows.size===0)windowFor();
  });
});
