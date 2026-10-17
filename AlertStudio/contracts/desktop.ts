import type { Command, Snapshot, Project } from './project';
import type { Installed } from '../sdk/ui';
import type { Effect } from '../sdk';
import type { RecoveryInfo, SessionStatus } from './recovery';
import type {PlaybackSnapshot,PlaybackCommand} from './playback';
import type {WindowCloseState,CloseChoice} from './close';
export interface Desktop {
  closeState():Promise<WindowCloseState>;subscribeClose(listener:(state:WindowCloseState)=>void):()=>void;respondClose(id:number,choice:CloseChoice):Promise<void>;
  createPreset(id:'cloud-network',language:'ru'|'en'):Promise<boolean>;
  playback():Promise<PlaybackSnapshot>;playbackCommand(command:PlaybackCommand):Promise<PlaybackSnapshot>;subscribePlayback(listener:(state:PlaybackSnapshot)=>void):()=>void;
  snapshot():Promise<Snapshot>; command(command:Command):Promise<Snapshot>;
  subscribe(listener:(snapshot:Snapshot)=>void):()=>void;
  extensions():Promise<Installed[]>; install():Promise<string|null>; extensionFolder():Promise<void>;
  defineEffect(definition:Omit<Effect,'evaluate'>):Promise<void>;
  save(as?:boolean):Promise<string|null>; open():Promise<boolean>; create(options:Pick<Project,'name'|'width'|'height'|'background'>):Promise<boolean>;
  session():Promise<SessionStatus>;
  subscribeSession(listener:(status:SessionStatus)=>void):()=>void;
  recoveries():Promise<RecoveryInfo[]>;
  restoreDraft(id:string):Promise<boolean>;
  dismissDraft(id:string):Promise<void>;
  detach(panel:string):Promise<void>;
}
declare global { interface Window { studio:Desktop; } }
