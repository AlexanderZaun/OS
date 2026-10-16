import { contextBridge, ipcRenderer } from 'electron';
import type { Desktop } from '../../contracts/desktop';
const bridge:Desktop={
  snapshot:()=>ipcRenderer.invoke('project:snapshot'),command:c=>ipcRenderer.invoke('project:command',c),
  subscribe:listener=>{const handler=(_e:unknown,s:Parameters<typeof listener>[0])=>listener(s);ipcRenderer.on('project:changed',handler);return()=>ipcRenderer.removeListener('project:changed',handler);},
  extensions:()=>ipcRenderer.invoke('extensions:list'),install:()=>ipcRenderer.invoke('extensions:install'),extensionFolder:()=>ipcRenderer.invoke('extensions:folder'),
  defineEffect:d=>ipcRenderer.invoke('effects:define',d),save:as=>ipcRenderer.invoke('project:save',as===true),open:()=>ipcRenderer.invoke('project:open'),create:o=>ipcRenderer.invoke('project:create',o),detach:p=>ipcRenderer.invoke('window:panel',p)
};
contextBridge.exposeInMainWorld('studio',bridge);
