import type {NotificationSettings,NotificationWorkspace} from '../../contracts/notification';
import {defaultNotification} from './definitions';
export function notificationDuration(settings:NotificationSettings|undefined,workspace:NotificationWorkspace){
  const s=settings??defaultNotification();
  return workspace==='intro'?s.introDuration:workspace==='outro'?s.outroDuration:workspace==='assembly'?Number((s.introDuration+s.holdDuration+s.outroDuration).toFixed(6)):s.holdDuration;
}
export function notificationFrame(settings:NotificationSettings|undefined,workspace:NotificationWorkspace,time:number){
  const s=settings??defaultNotification(),t=Number.isFinite(time)?Math.max(0,time):0;
  if(workspace==='main')return {effectTime:t,opacity:1,phase:'main' as const};
  const total=notificationDuration(s,'assembly');
  const globalTime=workspace==='outro'?s.introDuration+s.holdDuration+Math.min(t,s.outroDuration):workspace==='intro'?Math.min(t,s.introDuration):Math.min(t,total);
  if(workspace==='intro')return {effectTime:globalTime,opacity:s.introFade?Math.min(1,t/s.introDuration):1,phase:'intro' as const};
  if(workspace==='outro')return {effectTime:globalTime,opacity:s.outroFade?Math.max(0,1-t/s.outroDuration):t>=s.outroDuration?0:1,phase:'outro' as const};
  if(t>=total)return {effectTime:total,opacity:0,phase:'finished' as const};
  if(t<s.introDuration)return {effectTime:globalTime,opacity:s.introFade?t/s.introDuration:1,phase:'intro' as const};
  if(t<s.introDuration+s.holdDuration)return {effectTime:globalTime,opacity:1,phase:'main' as const};
  return {effectTime:globalTime,opacity:s.outroFade?Math.max(0,1-(t-s.introDuration-s.holdDuration)/s.outroDuration):1,phase:'outro' as const};
}
