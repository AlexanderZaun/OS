import type { Command, Snapshot, Project } from './project';
import type { Installed } from '../sdk/ui';
import type { Effect } from '../sdk';
export interface Desktop {
  snapshot():Promise<Snapshot>; command(command:Command):Promise<Snapshot>;
  subscribe(listener:(snapshot:Snapshot)=>void):()=>void;
  extensions():Promise<Installed[]>; install():Promise<string|null>; extensionFolder():Promise<void>;
  defineEffect(definition:Omit<Effect,'evaluate'>):Promise<void>;
  save(as?:boolean):Promise<string|null>; open():Promise<void>; create(options:Pick<Project,'name'|'width'|'height'|'background'>):Promise<void>;
  detach(panel:string):Promise<void>;
}
declare global { interface Window { studio:Desktop; } }
