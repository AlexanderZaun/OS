import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,unlink} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {Projects} from '../core/project/service';
import {defaultLayerEditor} from '../core/scene/layer-editor';
import {validateCommand,validateProject} from '../adapters/validation-ajv/project';
import {Files} from '../adapters/storage-files/project';
import {RecoveryStore} from '../adapters/storage-files/recovery';
import {textEffect} from '../modules/effects/text/src/register';
import {evaluateScene} from '../core/scene/evaluate';
import type {Effect} from '../sdk';
test('Locked layers reject mutations atomically; visibility, selection, tags, Solo and duplicate remain available',()=>{
  const model=new Projects(()=>[textEffect]);model.dispatch({type:'add',effect:'text'});const id=model.snapshot().selected!;
  model.dispatch({type:'editor',id,key:'locked',value:true});const before=model.snapshot();
  for(const command of [{type:'set',id,key:'x',value:100},{type:'patch',id,values:{x:100},revision:before.revision},{type:'rename',id,name:'Changed'},{type:'remove',id},{type:'reorder',id,direction:'up'},{type:'move',id,targetId:id,placement:'above',revision:before.revision},{type:'layer',id,key:'opacity',value:50}] as const)assert.throws(()=>model.dispatch(command),/layerLocked/);
  assert.deepEqual(model.snapshot(),before);
  model.dispatch({type:'select',id});model.dispatch({type:'visibility',id});model.dispatch({type:'editor',id,key:'tag',value:'purple'});model.dispatch({type:'editor',id,key:'solo',value:true});
  model.dispatch({type:'duplicate',id});const copy=model.snapshot().project.objects.at(-1)!;assert.equal(copy.editor?.locked,false);assert.equal(copy.editor?.solo,false);assert.equal(copy.editor?.tag,'purple');
  model.dispatch({type:'editor',id,key:'locked',value:false});model.dispatch({type:'set',id,key:'x',value:100});assert.equal(model.snapshot().project.objects[0].settings.x,100);
});
test('Editor values validate and undo without rewriting untouched legacy objects',()=>{
  const model=new Projects(()=>[textEffect]);model.dispatch({type:'add',effect:'text'});model.markSaved();const before=model.snapshot(),id=before.selected!;
  model.dispatch({type:'editor',id,key:'tag',value:'none'});model.dispatch({type:'clear-solo'});assert.deepEqual(model.snapshot(),before);
  for(const command of [{type:'editor',id,key:'tag',value:'invalid'},{type:'editor',id,key:'locked',value:1},{type:'editor',id,key:'solo',value:'true'}] as const)assert.throws(()=>model.dispatch(command));
  assert.throws(()=>validateCommand({type:'editor',id,key:'version',value:2}));assert.deepEqual(model.snapshot(),before);
  model.dispatch(validateCommand({type:'editor',id,key:'locked',value:true}));validateProject(model.snapshot().project);model.dispatch({type:'undo'});assert.deepEqual(model.snapshot().project,before.project);assert.equal(model.snapshot().dirty,false);
  model.dispatch({type:'redo'});assert.equal(model.snapshot().project.objects[0].editor?.locked,true);
  for(const editor of [{...defaultLayerEditor(),version:2},{...defaultLayerEditor(),tag:'invalid'},{...defaultLayerEditor(),solo:1}])assert.throws(()=>validateProject({...before.project,objects:[{...before.project.objects[0],editor}]}));
});
test('Multiple Solo layers respect visibility; clearing Solo is one undo step and clipping descriptors match output order',()=>{
  const model=new Projects(()=>[textEffect]);for(let i=0;i<3;i++)model.dispatch({type:'add',effect:'text'});const ids=model.snapshot().project.objects.map(o=>o.id);
  for(const id of ids.slice(0,2))model.dispatch({type:'editor',id,key:'solo',value:true});
  const frame=()=>evaluateScene(model.snapshot().project,[textEffect],0);assert.deepEqual(frame().layers.map(l=>l.id),ids.slice(0,2));
  model.dispatch({type:'visibility',id:ids[0]});assert.deepEqual(frame().layers.map(l=>l.id),[ids[1]]);model.dispatch({type:'visibility',id:ids[1]});assert.deepEqual(frame().layers,[]);
  const before=model.snapshot().project;model.dispatch({type:'clear-solo'});assert.deepEqual(frame().layers.map(l=>l.id),[ids[2]]);model.dispatch({type:'undo'});assert.deepEqual(model.snapshot().project,before);
});
test('Solo suppresses source drawing while dependent effects continue to receive source data',()=>{
  const source:Effect={id:'source',version:'0.1.0',label:{ru:'Источник',en:'Source'},settings:[],evaluate:()=>[{kind:'rect',x:5,y:0,width:10,height:10,color:'#ffffff',opacity:1}]};
  const consumer:Effect={id:'consumer',version:'0.1.0',label:{ru:'Зависимый',en:'Consumer'},settings:[{id:'source',type:'source',sourceType:'source',default:'',unit:'',animatable:false,label:{ru:'Источник',en:'Source'}}],evaluate:(_v,_t,ctx)=>{const p=ctx?.source('source');return p?[{...p,color:'#ff0000'}]:[];}};
  const model=new Projects(()=>[source,consumer]);model.dispatch({type:'add',effect:'source'});const sourceId=model.snapshot().selected!;model.dispatch({type:'add',effect:'consumer'});const id=model.snapshot().selected!;
  model.dispatch({type:'set',id,key:'source',value:sourceId});model.dispatch({type:'editor',id,key:'solo',value:true});model.dispatch({type:'editor',id:sourceId,key:'locked',value:true});
  const frame=evaluateScene(model.snapshot().project,[source,consumer],0);assert.equal(frame.primitives.length,1);assert.equal(frame.primitives[0].ownerId,id);assert.equal(frame.primitives[0].x,5);assert.deepEqual(frame.diagnostics,[]);assert.ok(frame.evaluatedIds.includes(sourceId));
});
test('Editor metadata roundtrips through separate files and Recovery; damaged values fall back safely',async()=>{
  const model=new Projects(()=>[textEffect]);model.dispatch({type:'add',effect:'text'});const id=model.snapshot().selected!,legacy=model.snapshot().project,folder=await mkdtemp(path.join(os.tmpdir(),'alert-layer-editor-')),files=new Files();await files.save(folder,legacy);
  for(const [key,value] of [['locked',true],['solo',true],['tag','orange']] as const)model.dispatch({type:'editor',id,key,value});const project=model.snapshot().project;await files.save(folder,project);assert.deepEqual(await files.open(folder),project);
  const recovery=new RecoveryStore(await mkdtemp(path.join(os.tmpdir(),'alert-editor-recovery-'))),draft=await recovery.save(project,null);assert.deepEqual(await recovery.open(draft.id),project);
  const index=JSON.parse(await readFile(path.join(folder,'project.json'),'utf8')),base=path.join(folder,'revisions',index.revision,'scenes/main/objects',id);assert.equal(JSON.parse(await readFile(path.join(base,'object.json'),'utf8')).editor,1);assert.deepEqual(JSON.parse(await readFile(path.join(base,'editor/settings/tag.json'),'utf8')),{value:'orange'});
  await unlink(path.join(base,'editor/settings/locked.json'));const opened=await files.openDetailed(folder);assert.equal(opened.usedBackup,true);assert.deepEqual(opened.project,legacy);
});
