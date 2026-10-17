import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {Projects} from '../core/project/service';
import {objectTemplates} from '../modules/presets/cloud-network/object-templates';
import {createCloudNetwork} from '../modules/presets/cloud-network/create';
import {fogEffect} from '../modules/effects/fog/src/model';
import {starsEffect} from '../modules/effects/stars/src/model';
import {networkEffect} from '../modules/effects/network/src/model';
import type {NetworkFrame} from '../modules/effects/network/src/model';
import {evaluateScene} from '../core/scene/evaluate';
import {Files} from '../adapters/storage-files/project';
import {validateCommand} from '../adapters/validation-ajv/project';
const effects=[fogEffect,starsEffect,networkEffect];
const service=()=>new Projects(()=>effects,undefined,()=>objectTemplates);

test('Example object templates add exactly one independent object with no preset-local links',()=>{
  const example=createCloudNetwork(effects,()=>crypto.randomUUID(),'en');
  const exampleIds=['Fog 1','Small stars','Large stars','Large-star network'];
  for(const [index,template] of objectTemplates.entries()){
    const model=service();
    const snapshot=model.dispatch(validateCommand({type:'add',effect:template.effect,template:template.id}));
    assert.equal(snapshot.project.objects.length,1);
    const object=snapshot.project.objects[0],original=example.objects.find(o=>o.name===exampleIds[index])!;
    assert.equal(snapshot.selected,object.id);
    for(const [key,value] of Object.entries(original.settings))assert.equal(object.settings[key],key==='source'?'':value);
    for(const [key,value] of Object.entries(object.settings))model.dispatch({type:'set',id:object.id,key,value});
    assert.equal(model.snapshot().revision,snapshot.revision); // All copied values pass normal validation without a change.
    if(template.effect!=='fog')assert.ok(evaluateScene(snapshot.project,effects,6).diagnostics.some(d=>d.code==='missing-source'));
    model.dispatch({type:'undo'});assert.equal(model.snapshot().project.objects.length,0);
    model.dispatch({type:'redo'});assert.deepEqual(model.snapshot().project,snapshot.project);
  }
});

test('Manual sources, duplicate independence, seeking and folder roundtrip work with both star variants',async()=>{
  const model=service();
  model.dispatch({type:'add',effect:'fog'});const fog=model.snapshot().selected!;
  for(const template of objectTemplates.filter(t=>t.effect==='stars')){
    model.dispatch({type:'add',effect:'stars',template:template.id});
    model.dispatch({type:'set',id:model.snapshot().selected!,key:'source',value:fog});
  }
  const large=model.snapshot().selected!;
  model.dispatch({type:'add',effect:'network'});const network=model.snapshot().selected!;
  model.dispatch({type:'set',id:network,key:'source',value:large});
  const project=model.snapshot().project,frame=evaluateScene(project,effects,6);
  assert.deepEqual(frame.diagnostics,[]);
  assert.ok((frame.primitives.find(p=>p.kind==='network')!.data as NetworkFrame).edges.length>0);
  evaluateScene(project,effects,12);assert.deepEqual(evaluateScene(project,effects,6),frame);
  model.dispatch({type:'duplicate',id:large});const copy=model.snapshot().selected!;
  model.dispatch({type:'set',id:copy,key:'count',value:15});
  assert.equal(model.snapshot().project.objects.find(o=>o.id===large)!.settings.count,70);
  assert.equal(model.snapshot().project.objects.find(o=>o.id===copy)!.settings.source,fog);
  const folder=await mkdtemp(path.join(os.tmpdir(),'alert-templates-'));
  const files=new Files();await files.save(folder,model.snapshot().project);
  assert.deepEqual(await files.open(folder),model.snapshot().project);
  model.dispatch({type:'remove',id:fog});assert.ok(evaluateScene(model.snapshot().project,effects,6).diagnostics.some(d=>d.code==='missing-source'));
  model.dispatch({type:'undo'});assert.deepEqual(evaluateScene(model.snapshot().project,effects,6).diagnostics,[]);
});

test('Creation profiles do not rewrite existing or incomplete legacy data; invalid choices are atomic',()=>{
  const legacy=new Projects(()=>effects);legacy.dispatch({type:'add',effect:'stars'});
  const old=legacy.snapshot().project;delete old.objects[0].settings.glintIntensity;
  const model=service();model.load(old);
  const before=model.snapshot();evaluateScene(before.project,effects,6);
  assert.deepEqual(model.snapshot(),before);
  for(const template of ['unknown','cloud-fog']){
    assert.throws(()=>model.dispatch({type:'add',effect:'stars',template}));assert.deepEqual(model.snapshot(),before);
  }
  assert.throws(()=>validateCommand({type:'add',effect:'stars',template:5}));
  model.dispatch({type:'add',effect:'stars'});
  assert.equal(model.snapshot().project.objects[1].settings.count,1900);
  assert.deepEqual(model.snapshot().project.objects[0],old.objects[0]);
});
