import {playbackTime} from '../../contracts/playback';
import type {PlaybackSnapshot,PlaybackCommand} from '../../contracts/playback';
import type {NotificationSettings} from '../../contracts/notification';
import {notificationDuration} from '../notification/evaluate';
export class Playback {
  private state:PlaybackSnapshot;
  private notificationSettings:NotificationSettings|undefined;
  private mainDuration=48;
  constructor(private now=()=>Date.now()){this.state={time:0,playing:false,updatedAt:now(),revision:0,duration:48,loop:false,speed:1};}
  snapshot(){return structuredClone(this.state);}
  reset(){this.mainDuration=48;this.state={...this.state,time:0,playing:false,workspace:'main',duration:48,updatedAt:this.now(),revision:this.state.revision+1};return this.snapshot();}
  notification(settings:NotificationSettings|undefined){
    if(JSON.stringify(settings)===JSON.stringify(this.notificationSettings))return false;
    this.notificationSettings=structuredClone(settings);
    if(!this.state.workspace||this.state.workspace==='main')return false;
    const now=this.now(),time=playbackTime(this.state,now),duration=notificationDuration(settings,this.state.workspace);
    this.state={...this.state,duration,time:Math.min(time,duration),playing:false,updatedAt:now,revision:this.state.revision+1};return true;
  }
  finish(){
    const s=this.state,now=this.now();
    if(s.workspace&&s.workspace!=='main'&&s.playing&&!s.loop&&s.time+Math.max(0,now-s.updatedAt)/1000*s.speed>=s.duration){this.state={...s,time:s.duration,playing:false,updatedAt:now,revision:s.revision+1};return true;}return false;
  }
  dispatch(raw:unknown){
    if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Invalid playback command');
    const command=raw as PlaybackCommand,keys=Object.keys(command).sort().join(',');
    const now=this.now(),time=playbackTime(this.state,now);let next={...this.state,time,updatedAt:now,revision:this.state.revision+1};
    const staged=!!next.workspace&&next.workspace!=='main';
    if(command.type==='preview'&&keys==='type,workspace'&&['main','intro','outro','assembly'].includes(command.workspace)){
      if(!next.workspace||next.workspace==='main')this.mainDuration=next.duration;
      next={...next,workspace:command.workspace,time:0,playing:false,loop:false,duration:command.workspace==='main'?this.mainDuration:notificationDuration(this.notificationSettings,command.workspace)};
    }
    else if(command.type==='toggle'&&keys==='type'){if(next.workspace&&next.workspace!=='main'&&!next.playing&&time>=next.duration)next.time=0;next.playing=!next.playing;}
    else if(command.type==='seek'&&keys==='time,type'&&Number.isFinite(command.time)&&command.time>=0&&command.time<=Number.MAX_SAFE_INTEGER){next.time=next.workspace&&next.workspace!=='main'?Math.min(command.time,next.duration):command.time;next.playing=false;}
    else if(command.type==='configure'&&keys==='duration,loop,speed,type'&&Number.isFinite(command.duration)&&command.duration>=(staged?.1:1)&&command.duration<=(staged?3720:3600)&&(!staged||command.duration===next.duration)&&typeof command.loop==='boolean'&&Number.isFinite(command.speed)&&command.speed>=0&&command.speed<=4){next={...next,duration:command.duration,loop:command.loop,speed:command.speed};if(!staged)this.mainDuration=command.duration;}
    else throw Error('Invalid playback command');
    this.state=next;return this.snapshot();
  }
}
