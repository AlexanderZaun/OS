import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type {CloudField,StarField} from '../contracts/fields';
import type {Effect,Primitive} from '../sdk';
import type {NetworkFrame} from '../modules/effects/network/src/model';
import {networkEffect} from '../modules/effects/network/src/model';
import {fogEffect} from '../modules/effects/fog/src/model';
import {starsEffect} from '../modules/effects/stars/src/model';
import {cloudDensity} from '../core/geometry/density';
import {MAX_MASK_SAMPLES} from '../core/geometry/line-mask';
import {evaluateScene} from '../core/scene/evaluate';
import {createCloudNetwork} from '../modules/presets/cloud-network/create';
import {Projects} from '../core/project/service';
import {Files} from '../adapters/storage-files/project';
const field:CloudField={shape:'ellipse',rotation:0,edge:.05,opening:.4,billows:[{x:-.65,y:0,radius:.4,weight:1},{x:.65,y:0,radius:.4,weight:1}]};
function source():Primitive<StarField>{return {kind:'stars',x:300,y:200,width:200,height:100,color:'#ffffff',opacity:1,data:{rotation:0,clip:'none',stars:[-65,65].map((x,id)=>({id,x,y:0,alpha:1,radius:2,color:0,sparkle:false})),cloud:{offsetX:0,offsetY:0,width:200,height:100,field}}};}
function evaluate(primitive=source(),values:Record<string,string|number>={}){return networkEffect.evaluate({distance:200,neighbors:1,mode:'segments',maskStep:10,...values},6,{source:()=>primitive as never})[0];}
test('Mask fades the middle of a line through a gap without changing its graph or endpoint alpha',()=>{
  const base=evaluate(),masked=evaluate(source(),{cloudMask:'density'}),a=(base.data as NetworkFrame).edges,b=(masked.data as NetworkFrame).edges;
  assert.equal(a.length,1);assert.deepEqual(b.map(({samples,...edge})=>edge),a);const samples=b[0].samples!;
  assert.equal(samples[0].alpha,1);assert.equal(samples.at(-1)!.alpha,1);assert.ok(samples.some(s=>s.t>.4&&s.t<.6&&s.alpha===0));
  assert.deepEqual(evaluate(source(),{cloudMask:'density',maskStrength:0}),base);
  const weak=(evaluate(source(),{cloudMask:'density',maskStrength:40}).data as NetworkFrame).edges[0].samples!;assert.ok(weak.every(s=>s.alpha>=.6&&s.alpha<=1));
});
test('Mask samples use the fog transform independently of star rotation and field offsets',()=>{
  const primitive=source();primitive.data!.rotation=.7;Object.assign(primitive.data!.cloud!,{offsetX:30,offsetY:-15,width:260,height:140,field:{...field,rotation:.4}});
  const frame=evaluate(primitive,{cloudMask:'density'}).data as NetworkFrame,cloud=primitive.data!.cloud!,sample=cloudDensity(cloud.field),c=Math.cos(.4),s=Math.sin(.4);
  for(const edge of frame.edges)for(const point of edge.samples!){const x=edge.a.x+(edge.b.x-edge.a.x)*point.t-primitive.x-cloud.offsetX,y=edge.a.y+(edge.b.y-edge.a.y)*point.t-primitive.y-cloud.offsetY;
    const d=Math.min(1,sample((x*c+y*s)/(cloud.width/2),(-x*s+y*c)/(cloud.height/2))/.12);assert.ok(Math.abs(point.alpha-d*d*(3-2*d))<1e-12);
  }
});
test('A missing fog mask diagnoses clearly and large graphs obey a global sampling budget',()=>{
  const primitive=source();delete primitive.data!.cloud;
  const fake:Effect={id:'stars',version:'0.1.0',label:{ru:'Звёзды',en:'Stars'},settings:[],evaluate:()=>[primitive]};
  const project=createCloudNetwork([fogEffect,starsEffect,networkEffect],()=>crypto.randomUUID(),'ru'),star=project.objects.find(o=>o.name==='Крупные звёзды')!,network=project.objects.find(o=>o.type==='network')!;
  project.objects=[star,network];network.settings.cloudMask='density';const scene=evaluateScene(project,[fake,networkEffect],6);
  assert.ok(scene.diagnostics.some(d=>d.code==='missing-mask'));assert.equal((scene.primitives.find(p=>p.kind==='network')!.data as NetworkFrame).edges.length,0);
  network.settings.maskStrength=0;assert.ok(!evaluateScene(project,[fake,networkEffect],6).diagnostics.some(d=>d.code==='missing-mask'));
  const many=source();many.width=20000;many.height=10000;many.data!.stars=Array.from({length:1000},(_,id)=>({id,x:(id%50)*150,y:Math.floor(id/50)*150,alpha:1,radius:1,color:0,sparkle:false}));
  const result=evaluate(many,{cloudMask:'density',distance:500,neighbors:4,pointLimit:1000,maskStep:4,mode:'triangles'}),frame=result.data as NetworkFrame;
  assert.equal(result.warning,'limit');assert.ok(frame.edges.length>1000);assert.ok(frame.edges.reduce((sum,e)=>sum+e.samples!.length,0)<=MAX_MASK_SAMPLES);assert.ok(frame.edges.every(e=>e.samples!.length>=2&&e.samples!.length<=32));
});
test('Mask controls roundtrip and old network values retain the unmasked defaults',async()=>{
  const effects=[fogEffect,starsEffect,networkEffect],project=createCloudNetwork(effects,()=>crypto.randomUUID(),'ru'),network=project.objects.find(o=>o.type==='network')!;
  const legacy=structuredClone(project),old=legacy.objects.find(o=>o.id===network.id)!;for(const key of ['cloudMask','maskStrength','maskStep','maskThreshold'])delete old.settings[key];
  network.settings.cloudMask='none';assert.deepEqual(evaluateScene(legacy,effects,6),evaluateScene(project,effects,6));
  const model=new Projects(()=>effects);model.load(project);for(const [key,value] of Object.entries({cloudMask:'density',maskStrength:70,maskStep:8,maskThreshold:20}))model.dispatch({type:'set',id:network.id,key,value});
  const before=model.snapshot();assert.throws(()=>model.dispatch({type:'set',id:network.id,key:'maskStep',value:3}));assert.deepEqual(model.snapshot(),before);
  const folder=await mkdtemp(path.join(os.tmpdir(),'alert-line-mask-')),files=new Files();await files.save(folder,before.project);const loaded=await files.open(folder);assert.deepEqual(loaded,before.project);assert.deepEqual(evaluateScene(loaded,effects,6),evaluateScene(before.project,effects,6));
});
