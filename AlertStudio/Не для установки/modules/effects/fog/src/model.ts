import type { Effect,EvaluationContext } from '../../../../sdk';
import type {CloudField} from '../../../../contracts/fields';
import { settings } from './settings';
import {cloudRadius} from '../../../../core/geometry/cloud';

export interface FogFrame {
  seed:number; detail:number; edge:number; opening:number; shape:string; rotation:number;
  roughness:number;brightness:number;quality:string;openingWidth:number;openingHeight:number;
  textureContrast:number;billowStretch:number;billowAngle:number;
  billows:{x:number;y:number;radius:number;weight:number;baseX:number;baseY:number;baseRadius:number;vx:number;vy:number}[];
}
export function randomSequence(seed:number) {
  let state=seed>>>0;
  return ()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
}
const tau=Math.PI*2;
function normalize(values:Record<string,unknown>){
  return Object.fromEntries(settings.map(s=>{
    let value=values[s.id]??s.default;
    if(s.type==='number')value=typeof value==='number'&&Number.isFinite(value)?Math.max(s.min??-Infinity,Math.min(s.max??Infinity,value)):s.default;
    if(s.type==='color'&&(typeof value!=='string'||!/^#[a-f0-9]{6}$/i.test(value)))value=s.default;
    if(s.type==='select'&&!s.options?.some(option=>option.value===value))value=s.default;
    return [s.id,value];
  }));
}
function geometry(v:Record<string,unknown>,context?:EvaluationContext){
  if(v.regionMode==='source'){
    const source=context?.source<CloudField>('regionSource');if(!source?.data)return undefined;
    return {x:source.x+Number(v.regionOffsetX),y:source.y+Number(v.regionOffsetY),width:source.width*Number(v.regionScale)/100,height:source.height*Number(v.regionScale)/100,
      rotation:source.data.rotation+Number(v.regionRotation)*Math.PI/180,shape:source.data.shape,roughness:source.data.roughness??.65};
  }
  return {x:Number(v.x),y:Number(v.y),width:Number(v.width),height:Number(v.height),rotation:Number(v.rotation)*Math.PI/180,shape:String(v.shape),roughness:Number(v.roughness)/100};
}
export const fogEffect:Effect={
  id:'fog',version:'0.1.0',label:{ru:'Туман',en:'Fog'},settings,
  editor:{position:v=>v.regionMode==='source'?{x:'regionOffsetX',y:'regionOffsetY'}:{x:'x',y:'y'},
    bounds:(v,_measure,context)=>geometry(normalize(v),context)??{x:0,y:0,width:0,height:0}},
  evaluate(values,time,context) {
    const v=normalize(values);
    const n=(key:string)=>Number(v[key]);
    if(n('density')===0||n('opacity')===0)return [];
    const region=geometry(v,context);if(!region)return [];
    // Periodic analytical motion: seeking never relies on earlier frames or playback FPS.
    const phase=(((Number.isFinite(time)?time:0)*n('speed')/100/n('loop'))%1)*tau+n('phase')/180*Math.PI;
    const random=randomSequence(n('seed')),wind=n('direction')/180*Math.PI;
    const drift=n('drift')/100,swirl=n('swirl')/100;
    const billows=Array.from({length:Math.floor(n('billowCount'))},(_,index)=>{
      const angle=random()*tau,radial=random(),p=random()*tau;
      const rim=String(v.distribution)==='rim'||(String(v.distribution)==='mixed'&&index%3!==0);
      const r=rim?(.72+radial*.24)*cloudRadius(region.shape,angle,region.roughness):Math.sqrt(radial)*.78;
      const baseX=Math.cos(angle)*r,baseY=Math.sin(angle)*r;
      const baseRadius=(.14+random()*.2)*n('scale')/100;
      const angularSpeed=n('speed')/100/n('loop')*tau;
      return {
        baseX,baseY,baseRadius,x:baseX+Math.sin(phase+p)*drift*.22*Math.cos(wind)+Math.cos(phase*2+p)*swirl*.08,
        y:baseY+Math.sin(phase+p)*drift*.22*Math.sin(wind)+Math.sin(phase*2+p)*swirl*.08,
        vx:angularSpeed*(Math.cos(phase+p)*drift*.22*Math.cos(wind)-2*Math.sin(phase*2+p)*swirl*.08),
        vy:angularSpeed*(Math.cos(phase+p)*drift*.22*Math.sin(wind)+2*Math.cos(phase*2+p)*swirl*.08),
        radius:baseRadius*(1+.12*Math.sin(phase+p)),weight:.65+random()*.35,
      };
    });
    return [{kind:'fog',x:region.x,y:region.y,width:region.width,height:region.height,color:String(v.color),opacity:n('opacity')/100,
      data:{seed:n('seed'),detail:n('detail')/100,edge:n('edge')/100,opening:n('opening')/100,shape:region.shape,rotation:region.rotation,
        roughness:region.roughness,brightness:n('brightness')/100,quality:String(v.quality),openingWidth:n('openingWidth')/100,openingHeight:n('openingHeight')/100,
        textureContrast:n('textureContrast')/100,billowStretch:n('billowStretch')/100,billowAngle:n('billowAngle')*Math.PI/180,
        billows:billows.map(b=>({...b,weight:b.weight*n('density')/100}))} satisfies FogFrame}];
  },
};
