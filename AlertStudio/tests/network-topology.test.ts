import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {StarField} from '../contracts/fields';
import type {Primitive} from '../sdk';
import {networkEffect,type NetworkFrame} from '../modules/effects/network/src/model';
import {starsEffect,type StarsFrame} from '../modules/effects/stars/src/model';
import {fogEffect} from '../modules/effects/fog/src/model';
import {createCloudNetwork} from '../modules/presets/cloud-network/create';
import {evaluateScene} from '../core/scene/evaluate';
import {Projects} from '../core/project/service';
import {Files} from '../adapters/storage-files/project';
import {mkdtemp} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
function source():Primitive<StarField>{return {kind:'stars',x:300,y:200,width:400,height:200,color:'#ffffff',opacity:1,data:{rotation:.4,clip:'none',stars:[0,10,30].map((x,id)=>({id,x,y:0,baseX:x,baseY:0,alpha:1,radius:1,color:0,sparkle:false}))}};}
function edges(primitive:Primitive<StarField>,topology='stable',distance=100){return (networkEffect.evaluate({topology,distance,neighbors:1,mode:'segments'},6,{source:()=>primitive as never})[0].data as NetworkFrame).edges;}
test('Stable links survive neighbor swaps and stretching; dynamic links follow current nearest points',()=>{
  const primitive=source(),before=edges(primitive),ids=before.map(e=>e.id);assert.deepEqual(ids,['0:1','1:2']);
  primitive.data!.stars[1].x=29;
  assert.deepEqual(edges(primitive).map(e=>e.id),ids);assert.deepEqual(edges(primitive,'dynamic').map(e=>e.id),['0:1','1:2']);
  primitive.data!.stars[0].x=29.8;
  assert.deepEqual(edges(primitive).map(e=>e.id),ids);assert.deepEqual(edges(primitive,'dynamic').map(e=>e.id),['0:2','0:1']);
  assert.notDeepEqual(edges(primitive)[0].a,before[0].a);
  primitive.data!.stars[1].x=500;const stretched=edges(primitive);assert.deepEqual(stretched.map(e=>e.id),ids);assert.ok(stretched.every(e=>e.alpha===0));
  primitive.data!.stars[1].x=10;primitive.data!.stars[0].x=0;assert.deepEqual(edges(primitive),before);
});
test('Rest clipping preserves graph membership while clipped current endpoints suppress lines; extensions can omit rest positions',()=>{
  const primitive=source();primitive.width=100;primitive.data!.clip='region';const before=edges(primitive);
  primitive.data!.stars[1].x=70;assert.deepEqual(edges(primitive).map(e=>e.id),before.map(e=>e.id));assert.ok(edges(primitive).every(e=>e.alpha===0));
  primitive.data!.clip='none';for(const star of primitive.data!.stars){delete star.baseX;delete star.baseY;}
  assert.deepEqual(edges(primitive),edges(primitive,'dynamic'));
});
test('Star rest positions and network topology are independent of seek order for field, contour and density distributions',()=>{
  const effects=[fogEffect,starsEffect,networkEffect],project=createCloudNetwork(effects,()=>crypto.randomUUID(),'ru'),network=project.objects.find(o=>o.type==='network')!,large=project.objects.find(o=>o.name==='Крупные звёзды')!;
  network.settings.topology='stable';network.settings.cloudMask='none';
  for(const distribution of ['field','contour','density']){
    Object.assign(large.settings,{fieldMode:distribution==='field'?'field':'cloud',cloudDistribution:distribution==='density'?'density':'contour',drift:25,wander:90});
    const at=(time:number)=>evaluateScene(project,effects,time),first=at(6),later=at(18),earlier=at(0),replay=at(6);
    assert.deepEqual(replay,first);assert.deepEqual(first.diagnostics,[]);
    const starFrame=(scene:ReturnType<typeof at>)=>scene.primitives.find(p=>p.ownerId===large.id)!.data as StarsFrame;
    const rest=(scene:ReturnType<typeof at>)=>starFrame(scene).stars.map(s=>[s.id,s.baseX,s.baseY]);
    assert.deepEqual(rest(first),rest(later));assert.deepEqual(rest(first),rest(earlier));
    const graph=(scene:ReturnType<typeof at>)=>(scene.primitives.find(p=>p.ownerId===network.id)!.data as NetworkFrame).edges.map(e=>e.id);
    assert.ok(graph(first).length>0);assert.deepEqual(graph(first),graph(later));assert.deepEqual(graph(first),graph(earlier));
  }
});
test('Topology setting validates, roundtrips and defaults to current-nearest for old projects',async()=>{
  const effects=[fogEffect,starsEffect,networkEffect],project=createCloudNetwork(effects,()=>crypto.randomUUID(),'ru'),network=project.objects.find(o=>o.type==='network')!;
  delete network.settings.topology;const legacy=evaluateScene(project,effects,6);network.settings.topology='dynamic';assert.deepEqual(evaluateScene(project,effects,6),legacy);
  const model=new Projects(()=>effects);model.load(project);assert.throws(()=>model.dispatch({type:'set',id:network.id,key:'topology',value:'unknown'}));
  model.dispatch({type:'set',id:network.id,key:'topology',value:'stable'});const saved=model.snapshot().project;
  const folder=await mkdtemp(path.join(os.tmpdir(),'alert-topology-')),files=new Files();await files.save(folder,saved);const loaded=await files.open(folder);assert.deepEqual(loaded,saved);assert.deepEqual(evaluateScene(loaded,effects,6),evaluateScene(saved,effects,6));
});
