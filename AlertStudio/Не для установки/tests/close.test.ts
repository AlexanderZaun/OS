import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {CloseCoordinator} from '../app/bootstrap/close-coordinator';
import {ProjectSession} from '../app/bootstrap/project-session';
import {Projects} from '../core/project/service';
import {Files} from '../adapters/storage-files/project';
import {RecoveryStore} from '../adapters/storage-files/recovery';
import {FolderLease} from '../adapters/storage-files/folder-lease';
import {textEffect} from '../modules/effects/text/src/register';
test('Close cancel, folder cancellation and save failure preserve the document; retry saves before quitting',async()=>{
  let mode='cancel',saves=0,quits=0;const finishes:boolean[]=[];
  const close=new CloseCoordinator({current:()=>({dirty:true,name:'Scene',folder:null}),save:async()=>{saves++;if(mode==='error')throw Error('Disk full');return mode==='save';},finish:async discard=>{finishes.push(discard);},quit:()=>quits++,changed:()=>{}});
  await close.request();const id=close.snapshot()!.id;await close.request();assert.equal(close.snapshot()!.id,id);
  await close.respond(id,'cancel');assert.equal(close.pending,false);assert.equal(saves,0);assert.equal(quits,0);
  await close.request();const next=close.snapshot()!.id;await assert.rejects(close.respond(id,'discard'));
  await close.respond(next,'save');assert.equal(close.snapshot()!.error,'closeSaveCanceled');assert.equal(quits,0);
  mode='error';await close.respond(next,'save');assert.equal(close.snapshot()!.phase,'confirm');assert.equal(close.snapshot()!.error,'closeSaveFailed');assert.match(close.snapshot()!.detail!,/Disk full/);
  mode='save';await close.respond(next,'save');assert.deepEqual(finishes,[true]);assert.equal(quits,1);
});
test('Close coordinator serializes choices and waits for save and disposal',async()=>{
  let releaseSave!:(v:boolean)=>void,releaseFinish!:()=>void,saves=0,quits=0;
  const saveGate=new Promise<boolean>(resolve=>releaseSave=resolve),finishGate=new Promise<void>(resolve=>releaseFinish=resolve);
  const close=new CloseCoordinator({current:()=>({dirty:true,name:'Scene',folder:'project'}),save:()=>{saves++;return saveGate;},finish:()=>finishGate,quit:()=>quits++,changed:()=>{}});
  await close.request();const id=close.snapshot()!.id,operation=close.respond(id,'save');assert.equal(close.snapshot()!.phase,'saving');
  await assert.rejects(close.respond(id,'discard'));await close.request();assert.equal(saves,1);assert.equal(quits,0);
  releaseSave(true);await Promise.resolve();await Promise.resolve();assert.equal(close.snapshot()!.phase,'closing');assert.equal(quits,0);
  releaseFinish();await operation;assert.equal(quits,1);
});
test('Discard failure keeps the close prompt available and retry never saves the project',async()=>{
  let fail=true,quits=0;
  const close=new CloseCoordinator({current:()=>({dirty:true,name:'Scene',folder:'project'}),save:async()=>{throw Error('Should not save');},finish:async discard=>{assert.equal(discard,true);if(fail)throw Error('Metadata locked');},quit:()=>quits++,changed:()=>{}});
  await close.request();const id=close.snapshot()!.id;await close.respond(id,'discard');assert.equal(quits,0);assert.equal(close.snapshot()!.error,'closeDiscardFailed');
  fail=false;await close.respond(id,'discard');assert.equal(quits,1);
});
test('Unchanged project closes without a confirmation and cleans its recovery candidate',async()=>{
  const phases:string[]=[];let quits=0;
  const close=new CloseCoordinator({current:()=>({dirty:false,name:'Scene',folder:'project'}),save:async()=>{throw Error('Should not save');},finish:async discard=>{assert.equal(discard,true);},quit:()=>quits++,changed:s=>{if(s)phases.push(s.phase);}});
  await close.request();assert.deepEqual(phases,['closing']);assert.equal(quits,1);
});
test('Discard waits for an in-flight draft, preserves the saved project and other recovery candidates',async()=>{
  const root=await mkdtemp(path.join(os.tmpdir(),'alert-close-')),folder=path.join(root,'Project'),recoveryRoot=path.join(root,'Recovery');await mkdir(folder);
  let release!:()=>void,started!:()=>void;const gate=new Promise<void>(resolve=>release=resolve),writing=new Promise<void>(resolve=>started=resolve);
  class SlowRecovery extends RecoveryStore {override async save(...args:Parameters<RecoveryStore['save']>){started();await gate;return super.save(...args);}}
  const model=new Projects(()=>[textEffect]),recovery=new SlowRecovery(recoveryRoot),session=new ProjectSession(model,recovery,()=>{},new Files(),60000);
  model.dispatch({type:'add',effect:'text'});await session.save(folder);const index=await readFile(path.join(folder,'project.json'),'utf8'),original=model.snapshot().project;
  const other=structuredClone(original);other.id=crypto.randomUUID();await new RecoveryStore(recoveryRoot).save(other,null);
  model.dispatch({type:'set',id:original.objects[0].id,key:'content',value:'Discard this'});session.changed();
  const flush=session.flushDraft();await writing;const close=session.dispose(true);await assert.rejects(FolderLease.acquire(folder));release();await Promise.all([flush,close]);
  assert.deepEqual((await recovery.list()).map(d=>d.id),[other.id]);assert.equal(await readFile(path.join(folder,'project.json'),'utf8'),index);assert.deepEqual(await new Files().open(folder),original);
  const lease=await FolderLease.acquire(folder);await lease.release();
});
test('A failed discard retains the folder lease and edits, then a retry dismisses the draft',async()=>{
  const root=await mkdtemp(path.join(os.tmpdir(),'alert-close-failure-')),folder=path.join(root,'Project');await mkdir(folder);let fail=true;
  class FailingRecovery extends RecoveryStore {override async dismiss(id:string){if(fail)throw Error('Metadata locked');await super.dismiss(id);}}
  const model=new Projects(()=>[textEffect]),recovery=new FailingRecovery(path.join(root,'Recovery')),session=new ProjectSession(model,recovery,()=>{},new Files(),60000);
  try{
    model.dispatch({type:'add',effect:'text'});await session.save(folder);const index=await readFile(path.join(folder,'project.json'),'utf8');
    model.dispatch({type:'set',id:model.snapshot().project.objects[0].id,key:'content',value:'Keep on failure'});session.changed();await session.flushDraft();
    const before=model.snapshot();await assert.rejects(session.dispose(true),/Metadata locked/);assert.deepEqual(model.snapshot(),before);assert.equal(session.busy,false);await assert.rejects(FolderLease.acquire(folder));
    fail=false;await session.dispose(true);assert.deepEqual(await recovery.list(),[]);assert.equal(await readFile(path.join(folder,'project.json'),'utf8'),index);
    const lease=await FolderLease.acquire(folder);await lease.release();
  }finally{fail=false;if(session.status().autosave==='pending')await session.dispose(true);}
});
