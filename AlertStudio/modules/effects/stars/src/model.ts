import type {Effect} from '../../../../sdk';
import {settings} from './settings';

export interface Star {x:number;y:number;radius:number;alpha:number;color:number;sparkle:boolean}
export interface StarsFrame {rotation:number;glow:number;palette:string;stars:Star[]}
function randomSequence(seed:number){let state=seed>>>0;return()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};}
const tau=2*Math.PI,wrap=(value:number)=>((value%1)+1)%1;
export const starsEffect:Effect={
  id:'stars',version:'0.1.0',label:{ru:'Звёзды',en:'Stars'},settings,
  editor:{position:{x:'x',y:'y'},bounds:v=>({x:Number(v.x),y:Number(v.y),width:Number(v.width),height:Number(v.height),rotation:Number(v.rotation)*Math.PI/180})},
  evaluate(values,time){
    const v=Object.fromEntries(settings.map(s=>{
      let value=values[s.id]??s.default;
      if(s.type==='number')value=typeof value==='number'&&Number.isFinite(value)?Math.max(s.min??-Infinity,Math.min(s.max??Infinity,value)):s.default;
      if(s.type==='color'&&(typeof value!=='string'||!/^#[a-f0-9]{6}$/i.test(value)))value=s.default;
      if(s.type==='select'&&!s.options?.some(option=>option.value===value))value=s.default;
      return [s.id,value];
    }));
    const n=(key:string)=>Number(v[key]),seconds=Number.isFinite(time)?time:0;
    if(n('count')<1||n('opacity')===0)return [];
    const random=randomSequence(n('seed'));
    // A fixed number of random samples per star keeps layout stable when count increases.
    const clusters=Array.from({length:4},()=>({x:.15+random()*.7,y:.15+random()*.7}));
    const direction=n('direction')/180*Math.PI,distribution=String(v.distribution);
    const stars=Array.from({length:Math.floor(n('count'))},()=>{
      const u=random(),v=random(),size=random(),phase=random()*tau,frequency=.18+random()*.42;
      const color=Math.floor(random()*3),sparkle=random()<n('sparkles')/100,depth=1-n('depth')/100*(1-size);
      let x=u,y=v;
      if(distribution==='clustered'){
        const center=clusters[Math.min(3,Math.floor(u*4))];
        const angle=v*tau,r=Math.sqrt(wrap(u*4))*.23;x=center.x+Math.cos(angle)*r;y=center.y+Math.sin(angle)*r;
      }
      x=wrap(x+seconds*n('drift')*depth*Math.cos(direction)/n('width'));
      y=wrap(y+seconds*n('drift')*depth*Math.sin(direction)/n('height'));
      const edge=Math.min(1,Math.min(x,1-x,y,1-y)/.025);
      const pulse=.5+.5*Math.sin(seconds*n('twinkleSpeed')/100*frequency*tau+phase);
      return {x:(x-.5)*n('width'),y:(y-.5)*n('height'),radius:n('size')*(1+n('variation')/100*(size*1.5-.75)),
        alpha:(1-n('twinkle')/100+n('twinkle')/100*pulse)*(.45+.55*size)*edge*edge*(3-2*edge),color,sparkle};
    });
    return [{kind:'stars',x:n('x'),y:n('y'),width:n('width'),height:n('height'),color:String(v.color),opacity:n('opacity')/100,
      data:{rotation:n('rotation')/180*Math.PI,glow:n('glow')/100,palette:String(v.palette),stars} satisfies StarsFrame}];
  },
};
