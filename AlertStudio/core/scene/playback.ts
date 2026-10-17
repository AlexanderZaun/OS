import {playbackTime} from '../../contracts/playback';
import type {PlaybackSnapshot,PlaybackCommand} from '../../contracts/playback';
export class Playback {
  private state:PlaybackSnapshot;
  constructor(private now=()=>Date.now()){this.state={time:0,playing:false,updatedAt:now(),revision:0,duration:48,loop:false,speed:1};}
  snapshot(){return structuredClone(this.state);}
  reset(){this.state={...this.state,time:0,playing:false,updatedAt:this.now(),revision:this.state.revision+1};return this.snapshot();}
  dispatch(raw:unknown){
    if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Invalid playback command');
    const command=raw as PlaybackCommand,keys=Object.keys(command).sort().join(',');
    const now=this.now(),time=playbackTime(this.state,now);let next={...this.state,time,updatedAt:now,revision:this.state.revision+1};
    if(command.type==='toggle'&&keys==='type')next.playing=!next.playing;
    else if(command.type==='seek'&&keys==='time,type'&&Number.isFinite(command.time)&&command.time>=0&&command.time<=Number.MAX_SAFE_INTEGER){next.time=command.time;next.playing=false;}
    else if(command.type==='configure'&&keys==='duration,loop,speed,type'&&Number.isFinite(command.duration)&&command.duration>=1&&command.duration<=3600&&typeof command.loop==='boolean'&&Number.isFinite(command.speed)&&command.speed>=0&&command.speed<=4){next={...next,duration:command.duration,loop:command.loop,speed:command.speed};}
    else throw Error('Invalid playback command');
    this.state=next;return this.snapshot();
  }
}
