import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createCloudNetwork} from '../modules/presets/cloud-network/create';
import {fogEffect} from '../modules/effects/fog/src/model';
import {starsEffect} from '../modules/effects/stars/src/model';
import {networkEffect} from '../modules/effects/network/src/model';
import type {NetworkFrame} from '../modules/effects/network/src/model';
import type {StarField} from '../contracts/fields';
import type {StarsFrame} from '../modules/effects/stars/src/model';
import type {FogFrame} from '../modules/effects/fog/src/model';
import type {Effect} from '../sdk';
import {evaluateScene,createSceneEvaluation} from '../core/scene/evaluate';
import {toWorld} from '../core/geometry/cloud';
import {Projects} from '../core/project/service';
import {Files} from '../adapters/storage-files/project';
import {Playback} from '../core/scene/playback';
import {playbackTime} from '../contracts/playback';
import {validateEffectDefinition} from '../adapters/validation-ajv/effect';
const effects=[fogEffect,starsEffect,networkEffect];
const preset=()=>createCloudNetwork(effects,()=>crypto.randomUUID(),'ru');
test('Shared fog region translates the full composition, inherits contour and roundtrips links',async()=>{
  const project=preset(),master=project.objects[0],before=evaluateScene(project,effects,6);
  Object.assign(master.settings,{x:1060,y:580});
  const moved=evaluateScene(project,effects,6);assert.deepEqual(moved.diagnostics,[]);
  for(const primitive of moved.primitives){const old=before.primitives.find(p=>p.ownerId===primitive.ownerId)!;
    if(primitive.kind==='network'){
      const edges=(primitive.data as NetworkFrame).edges,oldEdges=(old.data as NetworkFrame).edges;assert.equal(edges.length,oldEdges.length);
      for(let i=0;i<edges.length;i++)for(const end of ['a','b'] as const){assert.ok(Math.abs(edges[i][end].x-oldEdges[i][end].x-100)<1e-8);assert.ok(Math.abs(edges[i][end].y-oldEdges[i][end].y-40)<1e-8);}
    }else{assert.equal(primitive.x,old.x+100);assert.equal(primitive.y,old.y+40);assert.deepEqual(primitive.data,old.data);}
  }
  Object.assign(master.settings,{width:1000,height:600,rotation:30,shape:'rounded',roughness:20});
  const changed=evaluateScene(project,effects,12);for(const primitive of changed.primitives.filter(p=>p.kind==='fog'||p.kind==='stars')){
    assert.equal(primitive.width,1000);assert.equal(primitive.height,600);assert.equal((primitive.data as FogFrame).rotation,Math.PI/6);
    if(primitive.kind==='fog'){assert.equal((primitive.data as FogFrame).shape,'rounded');assert.equal((primitive.data as FogFrame).roughness,.2);}
  }
  assert.notDeepEqual((changed.primitives[0].data as FogFrame).billows,(changed.primitives[1].data as FogFrame).billows);
  const folder=await mkdtemp(path.join(os.tmpdir(),'alert-region-')),files=new Files();await files.save(folder,project);const loaded=await files.open(folder);assert.deepEqual(loaded,project);assert.deepEqual(evaluateScene(loaded,effects,12),changed);
});
test('Fog region chains compose offsets and scale; source cycles, inactive and missing links are safe',()=>{
  const project=preset(),[master,a,b]=project.objects;Object.assign(a.settings,{regionOffsetX:25,regionOffsetY:-10,regionScale:150,regionRotation:15});
  Object.assign(b.settings,{regionSource:a.id,regionOffsetX:10,regionOffsetY:20,regionScale:50,regionRotation:-5});
  const scene=evaluateScene(project,effects,6),frame=scene.primitives.find(p=>p.ownerId===b.id)!;
  assert.equal(frame.x,995);assert.equal(frame.y,550);assert.equal(frame.width,675);assert.equal(frame.height,360);assert.ok(Math.abs((frame.data as FogFrame).rotation-Math.PI/18)<1e-12);
  master.visible=false;assert.deepEqual(evaluateScene(project,effects,6).primitives.find(p=>p.ownerId===b.id),frame);
  const model=new Projects(()=>effects);model.load(project);const before=model.snapshot();
  assert.throws(()=>model.dispatch({type:'set',id:master.id,key:'regionSource',value:b.id}));assert.deepEqual(model.snapshot(),before);
  assert.throws(()=>model.dispatch({type:'set',id:a.id,key:'regionSource',value:a.id}));assert.deepEqual(model.snapshot(),before);
  assert.throws(()=>model.dispatch({type:'set',id:a.id,key:'regionSource',value:project.objects.find(o=>o.type==='stars')!.id}));
  model.dispatch({type:'remove',id:master.id});assert.ok(evaluateScene(model.snapshot().project,effects,6).diagnostics.some(d=>d.objectId===a.id&&d.code==='missing-source'));
  model.dispatch({type:'undo'});assert.deepEqual(evaluateScene(model.snapshot().project,effects,6),evaluateScene(project,effects,6));
  master.settings.opacity=0;assert.ok(evaluateScene(project,effects,6).diagnostics.some(d=>d.objectId===a.id&&d.code==='inactive-source'));
  master.settings.opacity=85;Object.assign(master.settings,{regionMode:'source',regionSource:b.id});assert.ok(evaluateScene(project,effects,6).diagnostics.some(d=>d.code==='cycle'));
});
test('Linked fog editor uses inherited bounds, edits offsets atomically and keeps independent settings',()=>{
  const project=preset(),[master,follower]=project.objects,editor=fogEffect.editor!;Object.assign(follower.settings,{regionScale:150,regionRotation:30});
  const context=()=>createSceneEvaluation(project,effects,0).contextFor(follower.id),box=editor.bounds(follower.settings,()=>0,context());
  assert.equal(box.x,960);assert.equal(box.width,1350);assert.equal(box.rotation,Math.PI/6);
  assert.deepEqual(typeof editor.position==='function'?editor.position(follower.settings):editor.position,{x:'regionOffsetX',y:'regionOffsetY'});
  const model=new Projects(()=>effects);model.load(project);const before=model.snapshot();model.dispatch({type:'patch',id:follower.id,values:{regionOffsetX:30,regionOffsetY:15},revision:before.revision});
  assert.equal(model.snapshot().revision,before.revision+1);assert.equal(model.snapshot().project.objects[0].settings.x,master.settings.x);
  const scene=evaluateScene(model.snapshot().project,effects,0),frame=scene.primitives.find(p=>p.ownerId===follower.id)!;assert.equal(frame.x,990);assert.equal(frame.y,555);
  model.dispatch({type:'undo'});assert.deepEqual(model.snapshot().project,project);
  follower.settings.regionMode='independent';const own=editor.bounds(follower.settings,()=>0,context());assert.equal(own.width,900);assert.equal(own.rotation,0);
  assert.equal(follower.settings.regionSource,master.id);
});
test('Appearance controls preserve source geometry, seeded star layout and network endpoints',async()=>{
  const project=preset(),before=evaluateScene(project,effects,6);
  const fog=project.objects[0],large=project.objects.find(o=>o.name==='Крупные звёзды')!,network=project.objects.find(o=>o.type==='network')!;
  Object.assign(fog.settings,{textureContrast:220,billowStretch:250,billowAngle:90});
  Object.assign(large.settings,{glintIntensity:100,glintFraction:100,glintLength:9,glintSpeed:130});
  Object.assign(network.settings,{dashLength:12,dashGap:8,dashSpeed:-13,outlineWidth:1.2,outlineColor:'#010203'});
  const scene=evaluateScene(project,effects,6),find=(frame:typeof scene,id:string)=>frame.primitives.find(p=>p.ownerId===id)!;
  assert.deepEqual((find(scene,fog.id).data as FogFrame).billows,(find(before,fog.id).data as FogFrame).billows);
  const stars=(find(scene,large.id).data as StarsFrame).stars;
  assert.deepEqual(stars.map(({glint,...star})=>star),(find(before,large.id).data as StarsFrame).stars.map(({glint,...star})=>star));
  assert.ok(stars.some(s=>s.glint!>.01));assert.ok(stars.every(s=>s.glint!>=0&&s.glint!<=1));
  const lines=find(scene,network.id).data as NetworkFrame;assert.deepEqual(lines.edges,(find(before,network.id).data as NetworkFrame).edges);
  assert.deepEqual(lines.dash,[12,8]);assert.equal(lines.dashOffset,-2);assert.equal(lines.outlineWidth,1.2);
  evaluateScene(project,effects,12);assert.deepEqual(evaluateScene(project,effects,6),scene);
  network.settings.dashLength=0;assert.equal((find(evaluateScene(project,effects,Infinity),network.id).data as NetworkFrame).dashOffset,0);
  const model=new Projects(()=>effects);model.load(project);
  for(const object of project.objects)for(const [key,value] of Object.entries(object.settings))model.dispatch({type:'set',id:object.id,key,value});
  const folder=await mkdtemp(path.join(os.tmpdir(),'alert-appearance-')),files=new Files();await files.save(folder,project);assert.deepEqual(await files.open(folder),project);
});
test('Glints can be disabled or frozen without stopping star motion',()=>{
  const base={count:100,glintIntensity:100,glintFraction:100,glintSpeed:0};
  const a=(starsEffect.evaluate(base,6)[0].data as StarsFrame).stars,b=(starsEffect.evaluate(base,12)[0].data as StarsFrame).stars;
  assert.deepEqual(a.map(s=>s.glint),b.map(s=>s.glint));assert.notDeepEqual(a.map(s=>s.x),b.map(s=>s.x));
  for(const values of [{...base,glintIntensity:0},{...base,glintFraction:0}])assert.ok((starsEffect.evaluate(values,6)[0].data as StarsFrame).stars.every(s=>s.glint===0));
  assert.deepEqual((starsEffect.evaluate({...base,count:110},6)[0].data as StarsFrame).stars.slice(0,100),a);
});
test('Legacy fog/stars values open without rewriting and retain their default standalone behavior',async()=>{
  const ids={fog:['x','y','width','height','rotation','edge','density','opacity','scale','detail','opening','seed','speed','direction','drift','swirl','loop','color','shape'],stars:['x','y','width','height','rotation','count','size','variation','opacity','glow','sparkles','seed','twinkle','twinkleSpeed','drift','direction','depth','color','distribution','palette']};
  const project=preset();project.objects=[fogEffect,starsEffect].map(effect=>({id:'old-'+effect.id,type:effect.id,name:effect.id,visible:true,settings:Object.fromEntries(effect.settings.filter(s=>ids[effect.id as keyof typeof ids].includes(s.id)).map(s=>[s.id,s.default]))}));project.modules={fog:'0.1.0',stars:'0.1.0'};
  const enriched=structuredClone(project);for(const object of enriched.objects){const effect=effects.find(e=>e.id===object.type)!;object.settings={...Object.fromEntries(effect.settings.map(s=>[s.id,s.default])),...object.settings};}
  assert.deepEqual(evaluateScene(project,effects,6).primitives,evaluateScene(enriched,effects,6).primitives);
  const copy=structuredClone(project),folder=await mkdtemp(path.join(os.tmpdir(),'alert-legacy-')),files=new Files();await files.save(folder,project);const loaded=await files.open(folder);assert.deepEqual(loaded,copy);evaluateScene(loaded,effects,12);assert.deepEqual(loaded,copy);
});
test('Linked preset validates settings, evaluates sources once and network endpoints match drawn stars',()=>{
  for(const {evaluate,editor,...definition} of effects)validateEffectDefinition(definition);
  const project=preset(),model=new Projects(()=>effects);model.load(project);
  for(const object of project.objects)for(const [key,value] of Object.entries(object.settings))model.dispatch({type:'set',id:object.id,key,value});
  assert.deepEqual(model.snapshot().project,project);
  const counts=new Map<string,number>();
  const instrumented=effects.map(effect=>({...effect,evaluate:(...args:Parameters<Effect['evaluate']>)=>{counts.set(effect.id,(counts.get(effect.id)??0)+1);return effect.evaluate(...args);}}));
  const scene=evaluateScene(project,instrumented,6);assert.deepEqual(scene.diagnostics,[]);assert.equal(scene.evaluatedIds.length,7);assert.equal(new Set(scene.evaluatedIds).size,7);assert.equal(counts.get('fog'),4);assert.equal(counts.get('stars'),2);
  const large=scene.primitives.find(p=>p.ownerId===project.objects.find(o=>o.name==='Крупные звёзды')!.id)!,points=(large.data as StarField).stars;
  const edges=(scene.primitives.find(p=>p.kind==='network')!.data as NetworkFrame).edges;assert.ok(edges.length>0);
  for(const edge of edges)for(const point of [edge.a,edge.b])assert.ok(points.some(p=>{const world=toWorld(p.x,p.y,large.x,large.y,(large.data as StarField).rotation);return world.x===point.x&&world.y===point.y;}));
  assert.equal(new Set(edges.map(e=>e.id)).size,edges.length);
  assert.deepEqual(evaluateScene(project,effects,6).primitives,scene.primitives);assert.notDeepEqual(evaluateScene(project,effects,12).primitives,scene.primitives);
  const largeObject=project.objects.find(o=>o.name==='Крупные звёзды')!;largeObject.visible=false;
  assert.deepEqual((evaluateScene(project,effects,6).primitives.find(p=>p.kind==='network')!.data as NetworkFrame).edges,edges);
});
test('Links survive save/reorder/duplicate, deleted sources diagnose and undo restores',async()=>{
  const project=preset(),model=new Projects(()=>effects);model.load(project);
  const large=project.objects.find(o=>o.name==='Крупные звёзды')!,network=project.objects.find(o=>o.type==='network')!;
  model.dispatch({type:'reorder',id:network.id,direction:'up'});assert.equal(model.snapshot().project.objects.find(o=>o.id===network.id)!.settings.source,large.id);
  model.dispatch({type:'duplicate',id:network.id});assert.equal(model.snapshot().project.objects.at(-1)!.settings.source,large.id);
  assert.throws(()=>model.dispatch({type:'set',id:network.id,key:'source',value:project.objects[0].id}));
  const folder=await mkdtemp(path.join(os.tmpdir(),'alert-links-')),files=new Files();await files.save(folder,model.snapshot().project);assert.deepEqual(await files.open(folder),model.snapshot().project);
  const index=JSON.parse(await readFile(path.join(folder,'project.json'),'utf8'));
  const source=JSON.parse(await readFile(path.join(folder,'revisions',index.revision,'scenes/main/objects',network.id,'settings/source.json'),'utf8'));assert.equal(source.value,large.id);
  model.dispatch({type:'remove',id:large.id});assert.ok(evaluateScene(model.snapshot().project,effects,6).diagnostics.some(d=>d.code==='missing-source'));
  model.dispatch({type:'undo'});assert.deepEqual(evaluateScene(model.snapshot().project,effects,6).diagnostics,[]);
});
test('Scene cycle, unknown type, empty and excessive network sources are bounded and diagnosed',()=>{
  const project=preset(),network=project.objects.find(o=>o.type==='network')!;network.settings.source=project.objects[0].id;
  assert.ok(evaluateScene(project,effects,6).diagnostics.some(d=>d.code==='wrong-source'));
  network.settings.source=project.objects.find(o=>o.name==='Мелкие звёзды')!.id;network.settings.pointLimit=10;
  assert.ok(evaluateScene(project,effects,6).diagnostics.some(d=>d.code==='limit'));
  const fake:Effect={id:'fake',version:'0.1.0',label:{ru:'X',en:'X'},settings:[{id:'source',type:'source',sourceType:'fake',default:'',unit:'',animatable:false,label:{ru:'X',en:'X'}}],evaluate:(_v,_t,c)=>c?.source('source')?[{kind:'rect',x:0,y:0,width:1,height:1,color:'#fff',opacity:1}]:[]};
  const cyclic={...project,modules:{fake:'0.1.0'},objects:[{id:'a',type:'fake',name:'A',visible:true,settings:{source:'b'}},{id:'b',type:'fake',name:'B',visible:true,settings:{source:'a'}}]};
  assert.ok(evaluateScene(cyclic,[fake],0).diagnostics.some(d=>d.code==='cycle'));
});
test('Shared playback anchors time, seeks deterministically, wraps and rejects invalid commands',()=>{
  let now=1000;const clock=new Playback(()=>now);const before=clock.snapshot();
  clock.dispatch({type:'seek',time:6});clock.dispatch({type:'toggle'});now=2500;assert.equal(playbackTime(clock.snapshot(),now),7.5);
  clock.dispatch({type:'toggle'});now=4000;assert.equal(playbackTime(clock.snapshot(),now),7.5);
  clock.dispatch({type:'configure',duration:8,loop:true,speed:2});clock.dispatch({type:'toggle'});now=5000;assert.equal(playbackTime(clock.snapshot(),now),1.5);
  const current=clock.snapshot();assert.throws(()=>clock.dispatch({type:'seek',time:NaN}));assert.throws(()=>clock.dispatch({type:'toggle',extra:true}));assert.deepEqual(clock.snapshot(),current);
  clock.reset();assert.equal(clock.snapshot().playing,false);assert.equal(clock.snapshot().time,0);assert.ok(clock.snapshot().revision>before.revision);
});
