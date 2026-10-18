import type {NotificationWorkspace} from './notification';
export interface PlaybackSnapshot {time:number;playing:boolean;updatedAt:number;revision:number;duration:number;loop:boolean;speed:number;workspace?:NotificationWorkspace;}
export type PlaybackCommand={type:'toggle'}|{type:'seek';time:number}|{type:'configure';duration:number;loop:boolean;speed:number}|{type:'preview';workspace:NotificationWorkspace};
export function playbackTime(state:PlaybackSnapshot,now:number){const time=state.time+(state.playing?Math.max(0,now-state.updatedAt)/1000*state.speed:0);return state.loop?((time%state.duration)+state.duration)%state.duration:state.workspace&&state.workspace!=='main'?Math.min(state.duration,time):time;}
