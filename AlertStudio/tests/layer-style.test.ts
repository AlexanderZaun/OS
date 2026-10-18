import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,unlink} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {Projects} from '../core/project/service';
import {defaultLayerStyle} from '../core/scene/layer-style';
import {validateCommand,validateProject} from '../adapters/validation-ajv/project';
import {Files} from '../adapters/storage-files/project';
import {writePng} from '../adapters/storage-files/png';
import {textEffect} from '../modules/effects/text/src/register';
import {evaluateScene} from '../core/scene/evaluate';
import {RecoveryStore} from '../adapters/storage-files/recovery';
test('Layer edits validate atomically, preserve legacy projects and participate in history and duplication',()=>{
  const model=new Projects(()=>[textEffect]);model.dispatch({type:'add',effect:'text'});model.markSaved();const before=model.snapshot(),id=before.selected!;
  model.dispatch({type:'layer',id,key:'blend',value:'normal'});assert.deepEqual(model.snapshot(),before);
  model.dispatch(validateCommand({type:'layer',id,key:'blend',value:'multiply'}));const changed=model.snapshot();
  assert.deepEqual(changed.project.objects[0].layer,{...defaultLayerStyle(),blend:'multiply'});validateProject(changed.project);
  for(const [key,value] of [['blend','unsupported'],['clip',1],['opacity',101],['hue',181],['saturation',-.1],['opacity',NaN],['opacity',.5]] as const)assert.throws(()=>model.dispatch({type:'layer',id,key,value}));
  assert.throws(()=>validateCommand({type:'layer',id,key:'version',value:2}));assert.deepEqual(model.snapshot(),changed);
  model.dispatch({type:'undo'});assert.deepEqual(model.snapshot().project,before.project);assert.equal(model.snapshot().dirty,false);
  model.dispatch({type:'redo'});assert.deepEqual(model.snapshot().project,changed.project);
  model.dispatch({type:'duplicate',id});const copy=model.snapshot().selected!;model.dispatch({type:'layer',id:copy,key:'hue',value:90});
  assert.equal(model.snapshot().project.objects[0].layer?.hue,0);assert.deepEqual(model.snapshot().project.objects[0].settings,before.project.objects[0].settings);
});
test('Layer values persist separately and damaged layer values fall back to a validated previous revision',async()=>{
  const model=new Projects(()=>[textEffect]);model.dispatch({type:'add',effect:'text'});const before=model.snapshot().project,id=model.snapshot().selected!;
  const folder=await mkdtemp(path.join(os.tmpdir(),'alert-layer-')),files=new Files();await files.save(folder,before);
  model.dispatch({type:'layer',id,key:'clip',value:true});model.dispatch({type:'layer',id,key:'saturation',value:20});const styled=model.snapshot().project;await files.save(folder,styled);
  assert.deepEqual(await files.open(folder),styled);
  const index=JSON.parse(await readFile(path.join(folder,'project.json'),'utf8')),base=path.join(folder,'revisions',index.revision,'scenes/main/objects',id);
  assert.equal(JSON.parse(await readFile(path.join(base,'object.json'),'utf8')).layer,1);
  assert.deepEqual(JSON.parse(await readFile(path.join(base,'layer/settings/saturation.json'),'utf8')),{value:20});
  const recovery=new RecoveryStore(await mkdtemp(path.join(os.tmpdir(),'alert-layer-recovery-')));await recovery.save(styled,null);const drafts=await recovery.list();assert.deepEqual(await recovery.open(drafts[0].id),styled);
  await unlink(path.join(base,'layer/settings/clip.json'));const reopened=await files.openDetailed(folder);assert.equal(reopened.usedBackup,true);assert.deepEqual(reopened.project,before);
});
test('Layer metadata changes render descriptors without changing effect provider frames; hidden and empty layers are explicit',()=>{
  const model=new Projects(()=>[textEffect]);model.dispatch({type:'add',effect:'text'});const id=model.snapshot().selected!,before=evaluateScene(model.snapshot().project,[textEffect],0);
  model.dispatch({type:'layer',id,key:'hue',value:100});const after=evaluateScene(model.snapshot().project,[textEffect],0);assert.deepEqual(after.primitives,before.primitives);assert.equal(after.layers[0].style?.hue,100);
  const missing={...model.snapshot().project,modules:{text:'9.0.0'}};assert.equal(evaluateScene(missing,[textEffect],0).layers.length,1);assert.equal(evaluateScene(missing,[textEffect],0).primitives.length,0);
  model.dispatch({type:'visibility',id});assert.deepEqual(evaluateScene(model.snapshot().project,[textEffect],0).layers,[]);
});
test('PNG writes replace the selected file atomically and report failures',async()=>{
  const folder=await mkdtemp(path.join(os.tmpdir(),'alert-png-')),file=path.join(folder,'frame.png');
  await writePng(file,new Uint8Array([1,2]));await writePng(file,new Uint8Array([3,4]));assert.deepEqual(await readFile(file),Buffer.from([3,4]));
  await assert.rejects(writePng(path.join(folder,'missing','frame.png'),new Uint8Array([1])));
});
