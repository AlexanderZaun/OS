import { contextBridge, ipcRenderer } from 'electron';
import type { Desktop } from '../../contracts/desktop';
const bridge:Desktop={
  captureFrame:()=>ipcRenderer.invoke('frame:capture'),savePng:(bytes,language)=>ipcRenderer.invoke('frame:save-png',bytes,language),
  closeState:()=>ipcRenderer.invoke('app:close-state'),respondClose:(id,choice)=>ipcRenderer.invoke('app:close-response',id,choice),
  subscribeClose:listener=>{const handler=(_e:unknown,state:Parameters<typeof listener>[0])=>listener(state);ipcRenderer.on('app:close-changed',handler);return()=>ipcRenderer.removeListener('app:close-changed',handler);},
  createPreset:(id,language)=>ipcRenderer.invoke('project:preset',id,language),
  playback:()=>ipcRenderer.invoke('playback:snapshot'),playbackCommand:c=>ipcRenderer.invoke('playback:command',c),
  subscribePlayback:listener=>{const handler=(_e:unknown,state:Parameters<typeof listener>[0])=>listener(state);ipcRenderer.on('playback:changed',handler);return()=>ipcRenderer.removeListener('playback:changed',handler);},
  snapshot:()=>ipcRenderer.invoke('project:snapshot'),command:c=>ipcRenderer.invoke('project:command',c),
  subscribe:listener=>{const handler=(_e:unknown,s:Parameters<typeof listener>[0])=>listener(s);ipcRenderer.on('project:changed',handler);return()=>ipcRenderer.removeListener('project:changed',handler);},
  extensions:()=>ipcRenderer.invoke('extensions:list'),install:()=>ipcRenderer.invoke('extensions:install'),extensionFolder:()=>ipcRenderer.invoke('extensions:folder'),
  defineEffect:d=>ipcRenderer.invoke('effects:define',d),save:as=>ipcRenderer.invoke('project:save',as===true),open:()=>ipcRenderer.invoke('project:open'),create:o=>ipcRenderer.invoke('project:create',o),detach:p=>ipcRenderer.invoke('window:panel',p),
  session:()=>ipcRenderer.invoke('session:status'),
  subscribeSession:listener=>{const handler=(_e:unknown,status:Parameters<typeof listener>[0])=>listener(status);ipcRenderer.on('session:changed',handler);return()=>ipcRenderer.removeListener('session:changed',handler);},
  recoveries:()=>ipcRenderer.invoke('recovery:list'),restoreDraft:id=>ipcRenderer.invoke('recovery:restore',id),dismissDraft:id=>ipcRenderer.invoke('recovery:dismiss',id)
};
contextBridge.exposeInMainWorld('studio',bridge);
