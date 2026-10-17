import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Projects} from '../core/project/service';
import {validateCommand} from '../adapters/validation-ajv/project';
import {createCloudNetwork} from '../modules/presets/cloud-network/create';
import {fogEffect} from '../modules/effects/fog/src/model';
import {starsEffect} from '../modules/effects/stars/src/model';
import {networkEffect} from '../modules/effects/network/src/model';
import {evaluateScene} from '../core/scene/evaluate';
import {Files} from '../adapters/storage-files/project';
import {mkdtemp} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
const effects=[fogEffect,starsEffect,networkEffect];
function model(){const m=new Projects(()=>effects);m.load(createCloudNetwork(effects,()=>crypto.randomUUID(),'ru'));return m;}
test('Layer rename trims and validates names, preserves links and is one undo step',()=>{
  const m=model(),before=m.snapshot(),star=before.project.objects.at(-1)!;
  m.dispatch(validateCommand({type:'rename',id:star.id,name:'  Опорные звёзды  '}));assert.equal(m.snapshot().project.objects.at(-1)!.name,'Опорные звёзды');
  assert.deepEqual(evaluateScene(m.snapshot().project,effects,6),evaluateScene(before.project,effects,6));
  m.dispatch({type:'undo'});assert.deepEqual(m.snapshot().project,before.project);m.dispatch({type:'redo'});assert.equal(m.snapshot().project.objects.at(-1)!.name,'Опорные звёзды');
  const unchanged=m.snapshot();for(const name of ['', '   ', 'a'.repeat(201)])assert.throws(()=>m.dispatch({type:'rename',id:star.id,name}));assert.deepEqual(m.snapshot(),unchanged);
  assert.throws(()=>validateCommand({type:'rename',id:star.id,name:'a',extra:true}));assert.throws(()=>validateCommand({type:'rename',id:star.id,name:'a'.repeat(201)}));
});
test('Exact layer moves handle both directions, preserve unrelated order and undo atomically',()=>{
  const m=model(),before=m.snapshot().project,ids=before.objects.map(o=>o.id),move=(id:string,targetId:string,placement:'above'|'below')=>m.dispatch(validateCommand({type:'move',id,targetId,placement,revision:m.snapshot().revision}));
  move(ids[0],ids[6],'above');assert.deepEqual(m.snapshot().project.objects.map(o=>o.id),[...ids.slice(1),ids[0]]);
  m.dispatch({type:'undo'});assert.deepEqual(m.snapshot().project,before);m.dispatch({type:'redo'});
  move(ids[0],ids[1],'below');assert.deepEqual(m.snapshot().project,before);
  move(ids[2],ids[4],'above');assert.deepEqual(m.snapshot().project.objects.map(o=>o.id),[ids[0],ids[1],ids[3],ids[4],ids[2],ids[5],ids[6]]);
  const same=m.snapshot();move(ids[2],ids[2],'below');assert.deepEqual(m.snapshot(),same);
  move(ids[2],ids[4],'above');assert.deepEqual(m.snapshot(),same);
  const stars=m.snapshot().project.objects.filter(o=>o.type==='stars');assert.deepEqual(stars.map(o=>o.settings.source),before.objects.filter(o=>o.type==='stars').map(o=>o.settings.source));
});
test('Stale drag and missing targets cannot mutate history; selection never references removed layers',()=>{
  const m=model(),before=m.snapshot(),id=before.project.objects[0].id,targetId=before.project.objects[1].id;
  m.dispatch({type:'select',id});const selected=m.snapshot();assert.throws(()=>m.dispatch({type:'move',id,targetId,placement:'above',revision:before.revision}));assert.deepEqual(m.snapshot(),selected);
  assert.throws(()=>m.dispatch({type:'move',id,targetId:'missing',placement:'above',revision:selected.revision}));assert.deepEqual(m.snapshot(),selected);
  assert.throws(()=>validateCommand({type:'move',id,targetId,placement:'sideways',revision:0}));
  m.dispatch({type:'remove',id});assert.equal(m.snapshot().selected,null);m.dispatch({type:'undo'});assert.ok(m.snapshot().project.objects.some(o=>o.id===id));
  m.dispatch({type:'add',effect:'fog'});assert.ok(m.snapshot().selected);m.dispatch({type:'undo'});assert.equal(m.snapshot().selected,null);
});
test('Renamed and reordered layers roundtrip in the existing multi-file format',async()=>{
  const m=model(),objects=m.snapshot().project.objects;m.dispatch({type:'rename',id:objects[2].id,name:'Дальний туман'});m.dispatch({type:'move',id:objects[2].id,targetId:objects.at(-1)!.id,placement:'above',revision:m.snapshot().revision});
  const project=m.snapshot().project,folder=await mkdtemp(path.join(os.tmpdir(),'alert-layers-')),files=new Files();await files.save(folder,project);const loaded=await files.open(folder);assert.deepEqual(loaded,project);assert.deepEqual(evaluateScene(loaded,effects,6),evaluateScene(project,effects,6));
});
