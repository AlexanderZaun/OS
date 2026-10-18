import type {Effect} from '../../../../sdk';
import type {StarField} from '../../../../contracts/fields';
import {toWorld} from '../../../../core/geometry/cloud';
import {cloudDensity} from '../../../../core/geometry/density';
import {lineMask,MAX_MASK_SAMPLES} from '../../../../core/geometry/line-mask';
import type {MaskSample} from '../../../../core/geometry/line-mask';
import {settings} from './settings';
export interface NetworkFrame {edges:{id:string;a:{x:number;y:number};b:{x:number;y:number};alpha:number;samples?:MaskSample[]}[];glow:number;glowRadius:number;lineWidth:number;limited:boolean;dash:number[];dashOffset:number;outlineWidth:number;outlineColor:string;}
export const networkEffect:Effect={id:'network',version:'0.1.0',label:{ru:'Сеть звёзд',en:'Star network'},settings,evaluate(values,time,context){
  const v=Object.fromEntries(settings.map(s=>[s.id,values[s.id]??s.default])),n=(key:string)=>{const s=settings.find(s=>s.id===key)!;const value=Number(v[key]);return Number.isFinite(value)?Math.max(s.min??-Infinity,Math.min(s.max??Infinity,value)):Number(s.default);};
  const source=context?.source<StarField>('source');if(!source?.data||n('opacity')===0)return [];
  const stable=v.topology==='stable',inside=(s:{x:number;y:number})=>source.data!.clip==='none'||(Math.abs(s.x)<=source.width/2&&Math.abs(s.y)<=source.height/2);
  const eligible=source.data.stars.filter(s=>(v.includeCenter==='yes'||!s.center)&&inside(stable?{x:s.baseX??s.x,y:s.baseY??s.y}:s));
  const densityAlpha=new Map<number,number>();
  const points=eligible.slice(0,Math.floor(n('pointLimit'))).map((s,i)=>{const id=s.id??i;densityAlpha.set(id,inside(s)?s.densityAlpha??1:0);return {...toWorld(s.x,s.y,source.x,source.y,source.data!.rotation),id};});
  const current=new Map(points.map(p=>[p.id,p]));
  // Choose links from rest positions, while drawing their current endpoints.
  const graph=stable?eligible.slice(0,points.length).map((s,i)=>({...toWorld(s.baseX??s.x,s.baseY??s.y,source.x,source.y,source.data!.rotation),id:s.id??i})):points;
  const distance=n('distance'),cells=new Map<string,typeof points>();
  const cell=(p:{x:number;y:number})=>[Math.floor(p.x/distance),Math.floor(p.y/distance)];
  for(const p of graph){const key=cell(p).join(':');if(!cells.has(key))cells.set(key,[]);cells.get(key)!.push(p);}
  const edges:NetworkFrame['edges']=[],seen=new Set<string>();
  function add(a:typeof points[number],b:typeof points[number]){
    if(a.id===b.id||edges.length>=3000)return;
    if(Math.hypot(a.x-b.x,a.y-b.y)>=distance)return;
    a=current.get(a.id)!;b=current.get(b.id)!;
    const d=Math.hypot(a.x-b.x,a.y-b.y);if(!stable&&(d>=distance||d<.001))return;
    const id=[a.id,b.id].sort((a,b)=>a-b).join(':');if(seen.has(id))return;seen.add(id);
    const fade=d<.001?0:Math.max(0,Math.min(1,(distance-d)/(distance*.2)));edges.push({id,a,b,alpha:fade*fade*(3-2*fade)*Math.min(densityAlpha.get(a.id)??1,densityAlpha.get(b.id)??1)});
  }
  for(const p of graph){const [x,y]=cell(p),near:typeof points=[];
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)near.push(...(cells.get(`${x+dx}:${y+dy}`)??[]));
    const neighbors=near.filter(q=>q.id!==p.id&&Math.hypot(q.x-p.x,q.y-p.y)<distance).sort((a,b)=>(Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))||a.id-b.id).slice(0,v.mode==='chains'?1:Math.floor(n('neighbors')));
    for(const q of neighbors)add(p,q);
    if(v.mode==='triangles'&&neighbors.length>=2)add(neighbors[0],neighbors[1]);
  }
  const maskRequested=v.cloudMask==='density'&&n('maskStrength')>0,cloud=source.data.cloud;
  const missingMask=maskRequested&&!cloud;
  let maskLimited=false;
  if(missingMask)edges.length=0;
  else if(maskRequested&&cloud){
    const density=cloudDensity(cloud.field),c=Math.cos(cloud.field.rotation),s=Math.sin(cloud.field.rotation);
    const cx=source.x+cloud.offsetX,cy=source.y+cloud.offsetY;
    const sample=(x:number,y:number)=>density(((x-cx)*c+(y-cy)*s)/(cloud.width/2),(-(x-cx)*s+(y-cy)*c)/(cloud.height/2));
    const budget=Math.max(2,Math.floor(MAX_MASK_SAMPLES/Math.max(1,edges.length)));
    for(const edge of edges){const mask=lineMask(edge.a,edge.b,sample,n('maskStep'),n('maskStrength')/100,n('maskThreshold')/100,budget);edge.samples=mask.samples;maskLimited ||= mask.limited;}
  }
  const limited=eligible.length>points.length||edges.length>=3000||maskLimited;
  const period=n('dashLength')+n('dashGap'),offset=(Number.isFinite(time)?time:0)*n('dashSpeed');
  return [{kind:'network',x:0,y:0,width:0,height:0,warning:missingMask?'missing-mask':limited?'limit':undefined,color:typeof v.color==='string'&&/^#[a-f0-9]{6}$/i.test(v.color)?v.color:'#42dfff',opacity:n('opacity')/100,
    data:{edges,glow:n('glow')/100,glowRadius:n('glowRadius'),lineWidth:n('width'),limited,
      dash:n('dashLength')>0?[n('dashLength'),n('dashGap')]:[],dashOffset:n('dashLength')>0?-((offset%period+period)%period):0,
      outlineWidth:n('outlineWidth'),outlineColor:typeof v.outlineColor==='string'&&/^#[a-f0-9]{6}$/i.test(v.outlineColor)?v.outlineColor:'#071223'} satisfies NetworkFrame}];
}};
