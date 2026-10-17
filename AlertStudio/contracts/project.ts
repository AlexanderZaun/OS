export type Value = string | number | boolean;
export interface SceneObject { id: string; type: string; name: string; visible: boolean; settings: Record<string, Value>; }
export interface Project { id: string; name: string; format: 1; width: number; height: number; background: string; objects: SceneObject[]; modules: Record<string,string>; }
export type Command =
  | { type: 'add'; effect: string }
  | { type: 'set'; id: string; key: string; value: Value }
  | { type: 'patch'; id: string; values: Record<string,Value>; revision:number }
  | { type: 'reorder'; id:string; direction:'up'|'down' }
  | { type: 'rename'; id:string; name:string }
  | { type: 'move'; id:string; targetId:string; placement:'above'|'below'; revision:number }
  | { type: 'select'; id: string | null }
  | { type: 'remove' | 'duplicate' | 'visibility'; id: string }
  | { type: 'undo' } | { type: 'redo' };
export interface Snapshot { project: Project; selected: string | null; revision: number; dirty: boolean; canUndo: boolean; canRedo: boolean; }
export interface ProjectService { snapshot(): Snapshot; dispatch(command: Command): Snapshot; }
export interface StorageAdapter { save(folder: string, project: Project): Promise<void>; open(folder: string): Promise<Project>; }
