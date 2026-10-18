import type {NotificationSettings,NotificationKey} from './notification';
import type {LayerStyle,LayerKey} from './layer';
import type {LayerEditor,LayerEditorKey} from './layer-editor';
import type {CopiedSettings,HistorySnapshot} from './editor-session';
export type Value = string | number | boolean;
export interface SceneObject { id: string; type: string; name: string; visible: boolean; settings: Record<string, Value>; layer?:LayerStyle; editor?:LayerEditor; }
export interface Project { id: string; name: string; format: 1; width: number; height: number; background: string; objects: SceneObject[]; modules: Record<string,string>; notification?:NotificationSettings; }
export type Command =
  | {type:'settings-copy';id:string}
  | {type:'settings-paste';id:string;keys:string[];appearance:boolean;revision:number}
  | {type:'history-jump';target:number|null;revision:number}
  | {type:'settings-reset';id:string;scope:'effect'|'layer';key:string|null;revision:number}
  | {type:'editor';id:string;key:LayerEditorKey;value:Value}
  | {type:'clear-solo'}
  | {type:'layer';id:string;key:LayerKey;value:Value}
  | {type:'notification';key:NotificationKey;value:Value}
  | { type: 'add'; effect: string; template?:string }
  | { type: 'set'; id: string; key: string; value: Value }
  | { type: 'patch'; id: string; values: Record<string,Value>; revision:number }
  | { type: 'reorder'; id:string; direction:'up'|'down' }
  | { type: 'rename'; id:string; name:string }
  | { type: 'move'; id:string; targetId:string; placement:'above'|'below'; revision:number }
  | { type: 'select'; id: string | null }
  | { type: 'remove' | 'duplicate' | 'visibility'; id: string }
  | { type: 'undo' } | { type: 'redo' };
export interface Snapshot { project: Project; selected: string | null; revision: number; dirty: boolean; canUndo: boolean; canRedo: boolean; clipboard?:CopiedSettings|null;history?:HistorySnapshot; }
export interface ProjectService { snapshot(): Snapshot; dispatch(command: Command): Snapshot; }
export interface StorageAdapter { save(folder: string, project: Project): Promise<void>; open(folder: string): Promise<Project>; }
