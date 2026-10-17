import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type {CloudField,StarField} from '../contracts/fields';
import type {NetworkFrame} from '../modules/effects/network/src/model';
import {cloudDensity,densityPlacement} from '../core/geometry/density';
import {toWorld} from '../core/geometry/cloud';
import {evaluateScene} from '../core/scene/evaluate';
import {fogEffect} from '../modules/effects/fog/src/model';
import {starsEffect} from '../modules/effects/stars/src/model';
import {networkEffect} from '../modules/effects/network/src/model';
import {createCloudNetwork} from '../modules/presets/cloud-network/create';
import {Projects} from '../core/project/service';
import {Files} from '../adapters/storage-files/project';
import {validateEffectDefinition} from '../adapters/validation-ajv/effect';
const effects=[fogEffect,starsEffect,networkEffect];
const preset=()=>createCloudNetwork(effects,()=>crypto.randomUUID(),'ru');
test('Density envelope follows opening, clipping and oriented billow stretch',()=>{
  const field:CloudField={shape:'ellipse',rotation:0,edge:.1,billows:[{x:0,y:0,radius:.8,weight:1}]};
  const density=cloudDensity(field);assert.equal(density(0,0),1);assert.equal(density(1.1,0),0);assert.equal(density(NaN,0),0);
  const opened=cloudDensity({...field,opening:.6,openingWidth:1.5,openingHeight:.5});assert.equal(opened(0,0),0);assert.ok(opened(.2,0)<opened(0,.2));
  const stretched=cloudDensity({...field,billowStretch:2}),rotated=cloudDensity({...field,billowStretch:2,billowAngle:Math.PI/2});
  assert.ok(stretched(.5,0)>stretched(0,.5));assert.ok(Math.abs(stretched(.5,0)-rotated(0,.5))<1e-10);
  assert.equal(cloudDensity({...field,billows:[]})(0,0),0);assert.equal(densityPlacement({...field,billows:[]},.5).pick(.5,.5,.5),undefined);
});
test('Importance placement concentrates in dense billows and caches rest geometry across motion',()=>{
  const field:CloudField={shape:'ellipse',rotation:0,edge:.1,billows:[{x:-.4,y:0,baseX:-.4,baseY:0,radius:.3,baseRadius:.3,weight:.2},{x:.4,y:0,baseX:.4,baseY:0,radius:.3,baseRadius:.3,weight:1}]};
  const density=cloudDensity(field),weak=densityPlacement(field,0),strong=densityPlacement(field,1);
  const average=(placement:typeof weak)=>Array.from({length:1000},(_,i)=>placement.pick((i+.5)/1000,.5,.5)!).reduce((sum,p)=>sum+density(p.x,p.y),0)/1000;
  assert.ok(average(strong)>average(weak)*1.3);assert.ok(strong.pick(1,.5,.5));
  const moved=structuredClone(field);for(const b of moved.billows){b.x+=.1;b.radius*=1.1;}
  assert.equal(densityPlacement(moved,1),strong);assert.notEqual(densityPlacement({...field,opening:.5},1),strong);
  assert.notEqual(cloudDensity(moved)(.4,0),density(.4,0));
});
test('Density stars replay, retain count prefix and fade in source coordinates; network follows density only',()=>{
  const project=preset(),large=project.objects.find(o=>o.name==='Крупные звёзды')!;
  Object.assign(large.settings,{cloudDistribution:'density',densityFade:100,centerCount:0,wander:0,attachment:0,twinkle:0,cloudScale:120,cloudRotation:27,offsetX:40,offsetY:-20});
  const scene=evaluateScene(project,effects,6),primitive=scene.primitives.find(p=>p.ownerId===large.id)!,stars=(primitive.data as StarField).stars;
  const fog=scene.primitives.find(p=>p.ownerId===large.settings.source)!,sample=cloudDensity(fog.data as CloudField),rotation=(fog.data as CloudField).rotation;
  for(const star of stars){const world=toWorld(star.x,star.y,primitive.x,primitive.y,(primitive.data as StarField).rotation),dx=world.x-fog.x,dy=world.y-fog.y;
    const density=sample((dx*Math.cos(rotation)+dy*Math.sin(rotation))/(fog.width/2),(-dx*Math.sin(rotation)+dy*Math.cos(rotation))/(fog.height/2));const v=Math.min(1,density/.12);
    assert.ok(Math.abs(star.densityAlpha!-v*v*(3-2*v))<1e-10);
  }
  evaluateScene(project,effects,12);assert.deepEqual(evaluateScene(project,effects,6),scene);
  large.settings.count=80;assert.deepEqual((evaluateScene(project,effects,6).primitives.find(p=>p.ownerId===large.id)!.data as StarField).stars.slice(0,70),stars);large.settings.count=70;
  const lines=(scene.primitives.find(p=>p.kind==='network')!.data as NetworkFrame).edges;
  large.settings.twinkle=100;assert.deepEqual((evaluateScene(project,effects,6).primitives.find(p=>p.kind==='network')!.data as NetworkFrame).edges,lines);
  large.settings.offsetX=2000;const outside=evaluateScene(project,effects,6);assert.ok((outside.primitives.find(p=>p.ownerId===large.id)!.data as StarField).stars.every(s=>s.densityAlpha===0));assert.ok((outside.primitives.find(p=>p.kind==='network')!.data as NetworkFrame).edges.every(e=>e.alpha===0));
  large.settings.densityFade=0;assert.ok((evaluateScene(project,effects,6).primitives.find(p=>p.ownerId===large.id)!.data as StarField).stars.every(s=>s.densityAlpha===1));
});
test('Density controls validate and roundtrip; conditions reject unknown secondary references',async()=>{
  const {evaluate,editor,...definition}=starsEffect;validateEffectDefinition(definition);
  const bad=structuredClone(definition);bad.settings.find(s=>s.id==='densityBias')!.when!.and![0].key='missing';assert.throws(()=>validateEffectDefinition(bad));
  const project=preset(),small=project.objects.find(o=>o.name==='Мелкие звёзды')!,model=new Projects(()=>effects);model.load(project);
  for(const [key,value] of Object.entries({cloudDistribution:'density',densityBias:80,densityFade:60}))model.dispatch({type:'set',id:small.id,key,value});
  const before=model.snapshot();assert.throws(()=>model.dispatch({type:'set',id:small.id,key:'densityBias',value:101}));assert.deepEqual(model.snapshot(),before);
  const folder=await mkdtemp(path.join(os.tmpdir(),'alert-density-')),files=new Files();await files.save(folder,before.project);const loaded=await files.open(folder);assert.deepEqual(loaded,before.project);assert.deepEqual(evaluateScene(loaded,effects,6),evaluateScene(before.project,effects,6));
});
