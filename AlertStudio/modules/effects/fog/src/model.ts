import type { Effect } from '../../../../sdk';
import { settings } from './settings';

export interface FogFrame {
  seed:number; detail:number; edge:number; opening:number; shape:string; rotation:number;
  billows:{x:number;y:number;radius:number;weight:number}[];
}
export function randomSequence(seed:number) {
  let state=seed>>>0;
  return ()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
}
const tau=Math.PI*2;
export const fogEffect:Effect={
  id:'fog',version:'0.1.0',label:{ru:'Туман',en:'Fog'},settings,
  editor:{position:{x:'x',y:'y'},bounds:v=>({x:Number(v.x),y:Number(v.y),width:Number(v.width),height:Number(v.height),rotation:Number(v.rotation)*Math.PI/180})},
  evaluate(values,time) {
    const v=Object.fromEntries(settings.map(s=>{
      let value=values[s.id]??s.default;
      if(s.type==='number')value=typeof value==='number'&&Number.isFinite(value)?Math.max(s.min??-Infinity,Math.min(s.max??Infinity,value)):s.default;
      if(s.type==='color'&&(typeof value!=='string'||!/^#[a-f0-9]{6}$/i.test(value)))value=s.default;
      if(s.type==='select'&&!s.options?.some(option=>option.value===value))value=s.default;
      return [s.id,value];
    }));
    const n=(key:string)=>Number(v[key]);
    if(n('density')===0||n('opacity')===0)return [];
    // Periodic analytical motion: seeking never relies on earlier frames or playback FPS.
    const phase=(((Number.isFinite(time)?time:0)*n('speed')/100/n('loop'))%1)*tau;
    const random=randomSequence(n('seed')),wind=n('direction')/180*Math.PI;
    const drift=n('drift')/100,swirl=n('swirl')/100;
    const billows=Array.from({length:36},()=>{
      const angle=random()*tau,r=Math.sqrt(random())*.78,p=random()*tau;
      const baseRadius=(.14+random()*.2)*n('scale')/100;
      return {
        x:Math.cos(angle)*r+Math.sin(phase+p)*drift*.22*Math.cos(wind)+Math.cos(phase*2+p)*swirl*.08,
        y:Math.sin(angle)*r+Math.sin(phase+p)*drift*.22*Math.sin(wind)+Math.sin(phase*2+p)*swirl*.08,
        radius:baseRadius*(1+.12*Math.sin(phase+p)),weight:.65+random()*.35,
      };
    });
    return [{kind:'fog',x:n('x'),y:n('y'),width:n('width'),height:n('height'),color:String(v.color),opacity:n('opacity')/100,
      data:{seed:n('seed'),detail:n('detail')/100,edge:n('edge')/100,opening:n('opening')/100,shape:String(v.shape),rotation:n('rotation')/180*Math.PI,
        billows:billows.map(b=>({...b,weight:b.weight*n('density')/100}))} satisfies FogFrame}];
  },
};
