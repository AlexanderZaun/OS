import type { UiHost } from '../../sdk/ui';
import type { Setting } from '../../sdk';
import x from './settings/x.setting.json';
import y from './settings/y.setting.json';
import radius from './settings/radius.setting.json';
export function register(host:UiHost) {
  host.registerEffect({id:'orbit',version:'0.1.0',label:{ru:'Орбита · внешний эффект',en:'Orbit · external effect'},settings:[x,y,radius] as Setting[],evaluate:(v,t)=>Array.from({length:48},(_,i)=>({kind:'rect',x:Number(v.x)+Math.cos(t+i*Math.PI/24)*Number(v.radius),y:Number(v.y)+Math.sin(t+i*Math.PI/24)*Number(v.radius),width:5,height:5,color:'#78ceff',opacity:.3+.7*i/48}))});
}
