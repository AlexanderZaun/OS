import type {CloudField} from '../../contracts/fields';
import {cloudRadius} from './cloud';
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
// Normalized cloud coordinates: the region spans [-1,1] on both axes.
// This is the smooth billow envelope, not the renderer's fine noise texture.
export function cloudDensity(field:CloudField,rest=false){
  const stretch=field.billowStretch??1,angle=field.billowAngle??0;
  const billows=field.billows.map(b=>{
    const rotation=Math.atan2(b.baseY??b.y,b.baseX??b.x)+angle;
    return {x:rest?b.baseX??b.x:b.x,y:rest?b.baseY??b.y:b.y,r:rest?b.baseRadius??b.radius:b.radius,weight:clamp(b.weight),c:Math.cos(rotation),s:Math.sin(rotation)};
  });
  return (x:number,y:number)=>{
    if(!Number.isFinite(x)||!Number.isFinite(y))return 0;
    const radius=Math.hypot(x,y)/cloudRadius(field.shape,Math.atan2(y,x),field.roughness);
    const edge=clamp((1-radius)/Math.max(.0001,field.edge??.65));let density=0;
    if(edge===0)return 0;
    for(const b of billows){if(b.r<=0)continue;const dx=x-b.x,dy=y-b.y;
      const qx=(dx*b.c+dy*b.s)/stretch/b.r,qy=(-dx*b.s+dy*b.c)*stretch/b.r;
      const alpha=Math.max(0,1-qx*qx-qy*qy)**2*b.weight;
      density+=alpha*(1-density);
    }
    const opening=field.opening??0;
    const q=opening>0?Math.hypot(x/(field.openingWidth??1),y/(field.openingHeight??1))/opening:1;
    const keep=q>=1?1:q<.4?q*.5:.2+(q-.4)*(.8/.6);
    return clamp(density*edge*edge*(3-2*edge)*keep);
  };
}
interface Placement {pick(u:number,jx:number,jy:number):{x:number;y:number}|undefined;}
const cache=new Map<string,Placement>();
// Bounded, time-independent importance map: seeking never rerolls the layout.
export function densityPlacement(field:CloudField,bias:number,center=false):Placement{
  const key=JSON.stringify([field.shape,field.roughness,field.edge,field.opening,field.openingWidth,field.openingHeight,field.billowStretch,field.billowAngle,bias,center,
    field.billows.map(b=>[b.baseX??b.x,b.baseY??b.y,b.baseRadius??b.radius,b.weight])]);
  const cached=cache.get(key);if(cached){cache.delete(key);cache.set(key,cached);return cached;}
  const size=48,extent=center ? .42 : 1,sample=cloudDensity(field,true),cumulative=new Float64Array(size*size);let total=0;
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const px=((x+.5)/size*2-1)*extent,py=((y+.5)/size*2-1)*extent;
    const value=center&&Math.hypot(px,py)>.42?0:sample(px,py);
    total+=value>0?value**(.5+clamp(bias)*2.5):0;cumulative[y*size+x]=total;
  }
  const result:Placement={pick(u,jx,jy){
    if(total===0)return undefined;
    const target=Math.min(1-Number.EPSILON,clamp(u))*total;let lo=0,hi=cumulative.length-1;
    while(lo<hi){const mid=(lo+hi)>>>1;if(cumulative[mid]<=target)lo=mid+1;else hi=mid;}
    return {x:((lo%size+clamp(jx))/size*2-1)*extent,y:((Math.floor(lo/size)+clamp(jy))/size*2-1)*extent};
  }};
  cache.set(key,result);if(cache.size>16)cache.delete(cache.keys().next().value!);return result;
}
