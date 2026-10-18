import type {NotificationKey,NotificationSettings} from '../../contracts/notification';
export const notificationDefinitions={
  introDuration:{type:'number',default:1,min:.1,max:60,step:.1},
  holdDuration:{type:'number',default:5,min:.1,max:3600,step:.1},
  outroDuration:{type:'number',default:1,min:.1,max:60,step:.1},
  introFade:{type:'boolean',default:true},outroFade:{type:'boolean',default:true},
} as const;
export const notificationKeys=Object.keys(notificationDefinitions) as NotificationKey[];
export function defaultNotification():NotificationSettings{return {version:1,...Object.fromEntries(notificationKeys.map(key=>[key,notificationDefinitions[key].default]))} as unknown as NotificationSettings;}
export function validNotificationValue(key:NotificationKey,value:unknown):boolean{
  const definition=notificationDefinitions[key];if(!definition)return false;
  if(definition.type==='boolean')return typeof value==='boolean';
  return typeof value==='number'&&Number.isFinite(value)&&value>=definition.min&&value<=definition.max&&Math.abs(value/definition.step-Math.round(value/definition.step))<1e-6;
}
