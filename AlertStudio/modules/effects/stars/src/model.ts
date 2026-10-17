import type {Effect,EvaluationContext} from '../../../../sdk';
import {settings} from './settings';
import type {CloudField,StarPoint,StarCloud} from '../../../../contracts/fields';
import {cloudRadius} from '../../../../core/geometry/cloud';
import {cloudDensity,densityPlacement} from '../../../../core/geometry/density';

export type Star=StarPoint;
export interface StarsFrame {rotation:number;glow:number;palette:string;stars:Star[];clip:string;shape:string;haloRadius:number;coreWhite:number;coreOpacity:number;haloColor:string;haloColorMode:string;glintLength:number;cloud?:StarCloud;}
function geometry(v:Record<string,unknown>,context?:EvaluationContext){
  if(v.fieldMode==='cloud'){
    const source=context?.source<CloudField>('source');if(!source)return undefined;
    return {source,x:source.x+Number(v.offsetX),y:source.y+Number(v.offsetY),width:source.width*Number(v.cloudScale)/100,height:source.height*Number(v.cloudScale)/100,rotation:source.data!.rotation+Number(v.cloudRotation)*Math.PI/180};
  }
  return {source:undefined,x:Number(v.x),y:Number(v.y),width:Number(v.width),height:Number(v.height),rotation:Number(v.rotation)*Math.PI/180};
}
const withDefaults=(v:Record<string,unknown>)=>Object.fromEntries(settings.map(s=>[s.id,v[s.id]??s.default]));
function randomSequence(seed:number){let state=seed>>>0;return()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};}
const tau=2*Math.PI,wrap=(value:number)=>((value%1)+1)%1;
export const starsEffect:Effect={
  id:'stars',version:'0.1.0',label:{ru:'Звёзды',en:'Stars'},settings,
  editor:{position:v=>v.fieldMode==='cloud'?{x:'offsetX',y:'offsetY'}:{x:'x',y:'y'},bounds:(v,_measure,context)=>geometry(withDefaults(v),context)??{x:0,y:0,width:0,height:0}},
  evaluate(values,time,context){
    const v=Object.fromEntries(settings.map(s=>{
      let value=values[s.id]??s.default;
      if(s.type==='number')value=typeof value==='number'&&Number.isFinite(value)?Math.max(s.min??-Infinity,Math.min(s.max??Infinity,value)):s.default;
      if(s.type==='color'&&(typeof value!=='string'||!/^#[a-f0-9]{6}$/i.test(value)))value=s.default;
      if(s.type==='select'&&!s.options?.some(option=>option.value===value))value=s.default;
      return [s.id,value];
    }));
    const n=(key:string)=>Number(v[key]),seconds=Number.isFinite(time)?time:0;
    if(n('count')<1||n('opacity')===0)return [];
    const region=geometry(v,context);if(!region)return [];
    const source=region.source?.data;
    const byDensity=!!source&&v.cloudDistribution==='density';
    const placement=byDensity?densityPlacement(source!,n('densityBias')/100):undefined;
    const centralPlacement=byDensity&&n('centerCount')>0?densityPlacement(source!,n('densityBias')/100,true):undefined;
    const sampleDensity=byDensity?cloudDensity(source!):undefined;
    const random=randomSequence(n('seed'));
    // A fixed number of random samples per star keeps layout stable when count increases.
    const clusters=Array.from({length:4},()=>({x:.15+random()*.7,y:.15+random()*.7}));
    const direction=n('direction')/180*Math.PI,distribution=String(v.distribution);
    const stars=Array.from({length:Math.floor(n('count'))},(_,id)=>{
      const u=random(),sampleV=random(),size=random(),phase=random()*tau,frequency=.18+random()*.42;
      const color=Math.floor(random()*3),sparkle=random()<n('sparkles')/100,depth=1-n('depth')/100*(1-size);
      let x=u,y=sampleV;
      if(distribution==='clustered'){
        const center=clusters[Math.min(3,Math.floor(u*4))];
        const angle=sampleV*tau,r=Math.sqrt(wrap(u*4))*.23;x=center.x+Math.cos(angle)*r;y=center.y+Math.sin(angle)*r;
      }
      let restX=(x-.5)*region.width,restY=(y-.5)*region.height;
      x=wrap(x+seconds*n('drift')*depth*Math.cos(direction)/n('width'));
      y=wrap(y+seconds*n('drift')*depth*Math.sin(direction)/n('height'));
      const center=!!source&&id<n('centerCount');
      let localX=(x-.5)*region.width,localY=(y-.5)*region.height,edge=Math.min(1,Math.min(x,1-x,y,1-y)/.025);
      let trailX: number|undefined,trailY:number|undefined;
      let densityAlpha:number|undefined;
      if(!source&&n('trails')>0){const dt=n('trails')/1000,px=wrap(x-dt*n('drift')*depth*Math.cos(direction)/n('width')),py=wrap(y-dt*n('drift')*depth*Math.sin(direction)/n('height'));
        if(Math.abs(px-x)<.5&&Math.abs(py-y)<.5){trailX=(px-.5)*region.width;trailY=(py-.5)*region.height;}}
      if(source){
        const jitterX=random()*2-1,jitterY=random()*2-1;
        const group=Math.floor(u*9),anchorAngle=group*tau/9;
        // Stable angular groups; anchors are chosen from rest positions, never current nearest neighbors.
        const a=anchorAngle+(u*9-group-.5)*tau/9*(.1+.9*n('uniformity')/100);
        const r=center?Math.sqrt(sampleV)*.42:(1-n('rimWidth')/100*size)*cloudRadius(source.shape,a,source.roughness);
        const chosen=byDensity?(center?centralPlacement:placement)?.pick(u,(jitterX+1)/2,(jitterY+1)/2):undefined;
        const baseX=chosen?.x??Math.cos(a)*r,baseY=chosen?.y??Math.sin(a)*r;
        const anchor=source.billows.reduce((best,b)=>{
          const distance=(b.baseX??b.x)-baseX,dy=(b.baseY??b.y)-baseY;
          const oldX=(best.baseX??best.x)-baseX,oldY=(best.baseY??best.y)-baseY;
          return distance*distance+dy*dy<oldX*oldX+oldY*oldY?b:best;
        },source.billows[0]);
        const attach=n('attachment')/100;
        const spread=center?1:n('spread')/100;
        let restPX=baseX,restPY=baseY;
        if(anchor&&!center&&!byDensity){const scatter=.035+.09*n('uniformity')/100;restPX=baseX*(1-attach)+((anchor.baseX??anchor.x)+jitterX*scatter)*attach;restPY=baseY*(1-attach)+((anchor.baseY??anchor.y)+jitterY*scatter)*attach;}
        restX=restPX*region.width/2*spread;restY=restPY*region.height/2*spread;
        const position=(t:number)=>{
          const wander=n('wander')/100*.15;
          let px=baseX+Math.sin(t*.31+phase)*wander,py=baseY+Math.cos(t*.27+phase*1.3)*wander;
          if(anchor){const ax=anchor.x+(anchor.vx??0)*(t-seconds),ay=anchor.y+(anchor.vy??0)*(t-seconds);
            if(center||byDensity){px+=(ax-(anchor.baseX??anchor.x))*attach;py+=(ay-(anchor.baseY??anchor.y))*attach;}
            else{const scatter=.035+.09*n('uniformity')/100;px=px*(1-attach)+(ax+jitterX*scatter)*attach;py=py*(1-attach)+(ay+jitterY*scatter)*attach;}}
          return {x:px*region.width/2*spread,y:py*region.height/2*spread};
        };
        const positionNow=position(seconds);localX=positionNow.x;localY=positionNow.y;edge=1;
        if(n('trails')>0){const previous=position(seconds-n('trails')/1000);trailX=previous.x;trailY=previous.y;}
        if(sampleDensity){
          const rotation=region.rotation-source.rotation,c=Math.cos(rotation),s=Math.sin(rotation);
          const dx=region.x-region.source!.x,dy=region.y-region.source!.y,sc=Math.cos(source.rotation),ss=Math.sin(source.rotation);
          const px=(dx*sc+dy*ss+localX*c-localY*s)/(region.source!.width/2),py=(-dx*ss+dy*sc+localX*s+localY*c)/(region.source!.height/2);
          const density=sampleDensity(px,py),visibility=Math.max(0,Math.min(1,density/.12));
          densityAlpha=chosen?(1-n('densityFade')/100+n('densityFade')/100*visibility*visibility*(3-2*visibility)):0;
        }
      }
      const pulse=.5+.5*Math.sin(seconds*n('twinkleSpeed')/100*frequency*tau+phase);
      const twinkles=wrap(u+size)<n('twinkleFraction')/100;
      // Reuse existing samples: enabling glints must never relocate stars or change their IDs.
      const glints=wrap(sampleV+size)<n('glintFraction')/100;
      const glint=glints?n('glintIntensity')/100*Math.max(0,Math.sin(seconds*n('glintSpeed')/100*frequency*tau+phase))**16:0;
      return {id,center,x:localX,y:localY,baseX:restX,baseY:restY,trailX,trailY,radius:n('size')*(1+n('variation')/100*(size*1.5-.75)),
        alpha:(twinkles?1-n('twinkle')/100+n('twinkle')/100*pulse:1)*(.45+.55*size)*edge*edge*(3-2*edge)*(densityAlpha??1),color,sparkle,glint,...(byDensity?{densityAlpha}:{} )};
    });
    return [{kind:'stars',x:region.x,y:region.y,width:region.width,height:region.height,color:String(v.color),opacity:n('opacity')/100,
      data:{rotation:region.rotation,glow:n('glow')/100,palette:String(v.palette),stars,clip:String(v.clip),shape:String(v.starShape),haloRadius:n('haloRadius'),coreWhite:n('coreWhite')/100,coreOpacity:n('coreOpacity')/100,haloColor:String(v.haloColor),haloColorMode:String(v.haloColorMode),glintLength:n('glintLength'),
        ...(region.source&&source?{cloud:{offsetX:region.source.x-region.x,offsetY:region.source.y-region.y,width:region.source.width,height:region.source.height,field:source}}:{})} satisfies StarsFrame}];
  },
};
