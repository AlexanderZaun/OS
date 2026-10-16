import type { Effect, Setting } from '../../../../sdk';
import type { ModuleHost } from '../../../../sdk';
import content from '../settings/content.setting.json';
import x from '../settings/x.setting.json';
import y from '../settings/y.setting.json';
import size from '../settings/size.setting.json';
import color from '../settings/color.setting.json';
export const textEffect:Effect={id:'text',version:'0.1.0',label:{ru:'Текст',en:'Text'},settings:[content,x,y,size,color] as Setting[],evaluate:v=>[{kind:'text',x:Number(v.x),y:Number(v.y),width:1600,height:600,color:String(v.color),opacity:1,text:String(v.content),size:Number(v.size)}]};
export function register(host:ModuleHost) { host.registerEffect(textEffect); }
