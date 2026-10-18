import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,unlink} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {Projects} from '../core/project/service';
import {defaultNotification} from '../core/notification/definitions';
import {notificationFrame,notificationDuration} from '../core/notification/evaluate';
import {Playback} from '../core/scene/playback';
import {playbackTime} from '../contracts/playback';
import {validateCommand,validateProject} from '../adapters/validation-ajv/project';
import {Files} from '../adapters/storage-files/project';
import {RecoveryStore} from '../adapters/storage-files/recovery';
import {textEffect} from '../modules/effects/text/src/register';
import {evaluateScene} from '../core/scene/evaluate';

test('Notification settings are explicit edits, validate atomically and undo to an unchanged legacy project',()=>{
  const model=new Projects(()=>[textEffect]);model.dispatch({type:'add',effect:'text'});model.markSaved();const before=model.snapshot();
  assert.equal(before.project.notification,undefined);
  for(const workspace of ['main','intro','outro','assembly'] as const)notificationFrame(undefined,workspace,2);
  assert.deepEqual(model.snapshot(),before);
  model.dispatch(validateCommand({type:'notification',key:'introDuration',value:.3}));
  assert.equal(model.snapshot().project.notification?.introDuration,.3);validateProject(model.snapshot().project);
  assert.equal(model.snapshot().dirty,true);assert.equal(model.snapshot().selected,before.selected);
  const changed=model.snapshot();
  for(const value of [-1,0,.15,61,'2',NaN])assert.throws(()=>model.dispatch({type:'notification',key:'introDuration',value}));
  assert.throws(()=>model.dispatch({type:'notification',key:'introFade',value:1}));
  assert.throws(()=>validateCommand({type:'notification',key:'version',value:2}));
  assert.deepEqual(model.snapshot(),changed);
  model.dispatch({type:'undo'});assert.deepEqual(model.snapshot().project,before.project);assert.equal(model.snapshot().dirty,false);
  model.dispatch({type:'redo'});assert.deepEqual(model.snapshot().project,changed.project);
});

test('Four workspaces map time and boundaries consistently without altering source object evaluation',()=>{
  const s=defaultNotification();assert.equal(notificationDuration(s,'assembly'),7);
  assert.equal(notificationFrame(s,'intro',0).opacity,0);assert.equal(notificationFrame(s,'intro',.5).opacity,.5);assert.equal(notificationFrame(s,'intro',1).opacity,1);
  assert.equal(notificationFrame(s,'outro',0).effectTime,6);assert.equal(notificationFrame(s,'outro',.5).opacity,.5);assert.equal(notificationFrame(s,'outro',1).opacity,0);
  assert.equal(notificationFrame(s,'assembly',1).phase,'main');assert.equal(notificationFrame(s,'assembly',6).phase,'outro');assert.equal(notificationFrame(s,'assembly',7).phase,'finished');
  assert.equal(notificationFrame(s,'assembly',100).opacity,0);assert.equal(notificationFrame(s,'main',100).opacity,1);
  assert.equal(notificationFrame({...s,introFade:false},'intro',0).opacity,1);
  assert.equal(notificationFrame({...s,outroFade:false},'outro',.9).opacity,1);assert.equal(notificationFrame({...s,outroFade:false},'outro',1).opacity,0);
  const model=new Projects(()=>[textEffect]);model.dispatch({type:'add',effect:'text'});const p=model.snapshot().project;
  const isolated=notificationFrame(s,'outro',.5),assembled=notificationFrame(s,'assembly',6.5);
  assert.equal(isolated.effectTime,assembled.effectTime);assert.equal(isolated.opacity,assembled.opacity);
  assert.deepEqual(evaluateScene(p,[textEffect],isolated.effectTime),evaluateScene(p,[textEffect],assembled.effectTime));
});

test('Stage playback clamps, stops, restarts and synchronizes settings while main playback retains its period',()=>{
  let now=0;const clock=new Playback(()=>now),s=defaultNotification();clock.notification(s);
  clock.dispatch({type:'configure',duration:12,loop:true,speed:1});clock.dispatch({type:'preview',workspace:'assembly'});
  assert.equal(clock.snapshot().duration,7);assert.equal(clock.snapshot().loop,false);
  clock.dispatch({type:'toggle'});now=8000;assert.equal(playbackTime(clock.snapshot(),now),7);assert.equal(clock.finish(),true);assert.equal(clock.snapshot().playing,false);
  clock.dispatch({type:'toggle'});assert.equal(clock.snapshot().time,0);
  clock.dispatch({type:'seek',time:100});assert.equal(clock.snapshot().time,7);
  clock.dispatch({type:'preview',workspace:'intro'});clock.dispatch({type:'configure',duration:1,loop:true,speed:1});clock.dispatch({type:'toggle'});now=9500;
  assert.equal(playbackTime(clock.snapshot(),now),.5);
  clock.notification({...s,introDuration:.3});assert.equal(clock.snapshot().duration,.3);assert.equal(clock.snapshot().time,.3);assert.equal(clock.snapshot().playing,false);
  clock.dispatch({type:'preview',workspace:'main'});assert.equal(clock.snapshot().duration,12);
  const before=clock.snapshot();assert.throws(()=>clock.dispatch({type:'preview',workspace:'unknown'}));assert.throws(()=>clock.dispatch({type:'preview',workspace:'intro',extra:true}));assert.throws(()=>clock.dispatch({type:'configure',duration:3601,loop:false,speed:1}));assert.deepEqual(clock.snapshot(),before);
  clock.reset();assert.equal(clock.snapshot().workspace,'main');assert.equal(clock.snapshot().time,0);
});

test('Notification values use separate files, recover fully and corrupt settings fall back to the previous revision',async()=>{
  const folder=await mkdtemp(path.join(os.tmpdir(),'alert-stages-')),files=new Files(),model=new Projects(()=>[textEffect]);
  model.dispatch({type:'add',effect:'text'});const legacy=model.snapshot().project;await files.save(folder,legacy);assert.deepEqual(await files.open(folder),legacy);
  model.dispatch({type:'notification',key:'holdDuration',value:2.3});const project=model.snapshot().project;
  await files.save(folder,project);assert.deepEqual(await files.open(folder),project);
  const index=JSON.parse(await readFile(path.join(folder,'project.json'),'utf8')),base=path.join(folder,'revisions',index.revision,'scenes/main');
  assert.equal(JSON.parse(await readFile(path.join(base,'notification/settings/holdDuration.json'),'utf8')).value,2.3);
  const recovery=new RecoveryStore(path.join(folder,'recovery'));await recovery.save(project,null);assert.deepEqual(await recovery.open(project.id),project);
  await unlink(path.join(base,'notification/settings/introDuration.json'));const opened=await files.openDetailed(folder);assert.equal(opened.usedBackup,true);assert.deepEqual(opened.project,legacy);
});

test('A failed stage save preserves the last saved revision and malformed notification formats are rejected',async()=>{
  const folder=await mkdtemp(path.join(os.tmpdir(),'alert-stage-fault-')),files=new Files(),model=new Projects(()=>[]);const p=model.snapshot().project;
  await files.save(folder,p);model.dispatch({type:'notification',key:'introFade',value:false});
  await assert.rejects(new Files(point=>{if(point==='before-index')throw Error('interrupted');}).save(folder,model.snapshot().project));assert.deepEqual(await files.open(folder),p);
  for(const notification of [{...defaultNotification(),version:2},{...defaultNotification(),introDuration:.15},{...defaultNotification(),extra:1}])assert.throws(()=>validateProject({...p,notification}));
});
