import {test} from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {Projects} from '../core/project/service';
import {textEffect} from '../modules/effects/text/src/register';
import {Files} from '../adapters/storage-files/project';
import {Extensions,validatePackage} from '../adapters/storage-files/extensions';
import {orderModules} from '../core/modules/order';
import {validateManifest} from '../adapters/validation-ajv/manifest';
import {validateCommand} from '../adapters/validation-ajv/project';
import type {Manifest} from '../sdk';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { FolderLease } from '../adapters/storage-files/folder-lease';
import { RecoveryStore } from '../adapters/storage-files/recovery';
import { ProjectSession } from '../app/bootstrap/project-session';
test('Independent duplicates, validation, history and pure evaluation',()=>{
  const service=new Projects(()=>[textEffect]);service.dispatch({type:'add',effect:'text'});const first=service.snapshot().selected!;
  service.dispatch({type:'duplicate',id:first});const second=service.snapshot().selected!;
  service.dispatch({type:'set',id:second,key:'content',value:'Другой текст'});
  assert.notEqual(service.snapshot().project.objects[0].settings.content,service.snapshot().project.objects[1].settings.content);
  service.dispatch({type:'undo'});assert.equal(service.snapshot().project.objects[1].settings.content,'Спасибо за поддержку!');
  service.dispatch({type:'redo'});assert.equal(service.snapshot().project.objects[1].settings.content,'Другой текст');
  const before=service.snapshot();textEffect.evaluate(before.project.objects[0].settings,6);assert.deepEqual(service.snapshot(),before);
  assert.throws(()=>service.dispatch({type:'set',id:first,key:'size',value:-1}));assert.throws(()=>validateCommand({type:'set',id:first,key:'x',value:4,extra:'unsafe'}));
});
test('Multi-file round trip, unknown effect/values, failure before commit preserves old revision',async()=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'alert-project-'));const model=new Projects(()=>[textEffect]);model.dispatch({type:'add',effect:'text'});
  const p=model.snapshot().project;p.objects[0].type='unknown-module';p.modules['unknown-module']='9.2.0';p.objects[0].settings.future=42;
  const files=new Files();await files.save(dir,p);assert.deepEqual(await files.open(dir),p);
  const index=JSON.parse(await fs.readFile(path.join(dir,'project.json'),'utf8'));assert.equal(index.objects,undefined);
  const settingsDir=path.join(dir,'revisions',index.revision,'scenes/main/objects',p.objects[0].id,'settings');assert.ok((await fs.readdir(settingsDir)).includes('content.json'));
  const changed=structuredClone(p);changed.objects[0].settings.content='interrupted';let count=0;
  await assert.rejects(new Files(()=>{if(++count===3)throw Error('Simulated power interruption');}).save(dir,changed));
  assert.deepEqual(await files.open(dir),p);await files.save(dir,changed);assert.deepEqual(await files.open(dir),changed);
});
function manifest(id:string,dependencies:Record<string,string>={}):Manifest{return {id,version:'0.1.0',sdk:'0.1',entry:'entry.js',kind:'panel',dependencies,backends:[],files:{'entry.js':'a'.repeat(64)}};}
test('SDK mismatch, duplicate IDs, missing and cyclic dependencies are rejected',()=>{
  assert.throws(()=>validateManifest({...manifest('one'),sdk:'0.2'}));assert.throws(()=>orderModules([manifest('one'),manifest('one')]));
  assert.throws(()=>orderModules([manifest('one',{two:'0.1.0'})]));assert.throws(()=>orderModules([manifest('one',{two:'0.1.0'}),manifest('two',{one:'0.1.0'})]));
  assert.deepEqual(orderModules([manifest('one',{two:'0.1.0'}),manifest('two')]).map(m=>m.id),['two','one']);
});
test('Validated installation, digest tampering, staging stays inert',async()=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'alert-extension-'));const source=path.join(dir,'source');await fs.mkdir(source);const code='export function register(host) {}';
  const m=manifest('test-panel');m.files['entry.js']=createHash('sha256').update(code).digest('hex');await fs.writeFile(path.join(source,'entry.js'),code);await fs.writeFile(path.join(source,'manifest.json'),JSON.stringify(m));
  const extensions=new Extensions(path.join(dir,'Extensions'));await fs.mkdir(path.join(extensions.root,'staging','incomplete'),{recursive:true});assert.deepEqual(await extensions.list(),[]);
  await extensions.install(source);assert.equal((await extensions.list())[0].id,m.id);await assert.rejects(extensions.install(source));
  await fs.writeFile(path.join(source,'entry.js'),'changed');await assert.rejects(validatePackage(source),/Digest mismatch/);
  const unsafe={...m,entry:'../entry.js',files:{'../entry.js':m.files['entry.js']}};await fs.writeFile(path.join(source,'manifest.json'),JSON.stringify(unsafe));await assert.rejects(validatePackage(source));
});

test('Interrupted metadata/backup/commit writes retain the old project; broken primary falls back visibly', async () => {
  const folder = await fs.mkdtemp(path.join(os.tmpdir(), 'alert-backup-'));
  const model = new Projects(() => [textEffect]);
  model.dispatch({type:'add',effect:'text'});
  const first = model.snapshot().project;
  const files = new Files();
  await files.save(folder, first);
  const second = structuredClone(first);
  second.objects[0].settings.content = 'second revision';
  for (const point of ['after-object-metadata','after-backup','before-index']) {
    await assert.rejects(new Files(file => { if(file===point)throw Error(`Injected: ${point}`); }).save(folder,second));
    assert.deepEqual(await files.open(folder), first);
  }
  await files.save(folder, second);
  await fs.writeFile(path.join(folder,'project.json'), '{damaged');
  const recovered = await files.openDetailed(folder);
  assert.equal(recovered.usedBackup, true);
  assert.deepEqual(recovered.project, first);
  // Re-saving after recovery never replaces the valid backup with corrupt bytes.
  await files.save(folder, second);
  assert.equal((await files.openDetailed(folder)).usedBackup, false);
  assert.deepEqual(await files.open(folder), second);
  await fs.rename(path.join(folder,'project.json'),path.join(folder,'project.missing.json'));
  await assert.rejects(new Files(point=>{if(point==='before-index')throw Error('Interrupted missing-index save');}).save(folder,second));
  assert.deepEqual(await files.open(folder),first);
  const unrelated = new Projects(()=>[textEffect]).snapshot().project;
  await assert.rejects(files.save(folder,unrelated),/projectFolderContainsOtherProject/);
  assert.deepEqual(await files.open(folder),first);
});

test('Windows project lease excludes another process and is released on process death', {skip:process.platform!=='win32',timeout:15000}, async t => {
  const folder = await fs.mkdtemp(path.join(os.tmpdir(), 'alert-lease-'));
  const child = spawn(process.execPath, ['artifacts/lease-worker.cjs',folder], {stdio:['ignore','pipe','pipe','ipc']});
  t.after(() => { child.kill(); });
  await Promise.race([once(child,'message'),once(child,'exit').then(() => {throw Error('Lease worker exited before ready');})]);
  await assert.rejects(FolderLease.acquire(folder), /projectBusy/);
  const exited = once(child,'exit');
  child.kill();
  await exited;
  const lease = await FolderLease.acquire(folder);
  await lease.release();
  const again = await FolderLease.acquire(folder);
  await again.release();
});

test('Recovery is independent from explicit Save; restore remains dirty and failed open retains the current document', {skip:process.platform!=='win32'}, async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(),'alert-session-'));
  const folder = path.join(root,'Project');await fs.mkdir(folder);
  const model = new Projects(() => [textEffect]);
  const recovery = new RecoveryStore(path.join(root,'Recovery'));
  const session = new ProjectSession(model,recovery,()=>{},new Files(),60000);
  try {
    model.dispatch({type:'add',effect:'text'});session.changed();
    await session.save(folder);
    const first = model.snapshot().project;
    const id = first.objects[0].id;
    model.dispatch({type:'set',id,key:'content',value:'Recovered content'});session.changed();
    await session.flushDraft();
    assert.equal(session.status().autosave,'saved');
    assert.deepEqual(await new Files().open(folder),first);
    assert.equal((await recovery.list()).length,1);
    const before = model.snapshot();
    await assert.rejects(session.open(path.join(root,'missing')));
    assert.deepEqual(model.snapshot(),before);
    await session.restore(first.id);
    assert.equal(model.snapshot().dirty,true);
    assert.equal(model.snapshot().project.objects[0].settings.content,'Recovered content');
    assert.equal(session.status().folder,null);
    const otherLease = await FolderLease.acquire(folder);await otherLease.release();
    await session.save(folder);
    assert.equal(model.snapshot().dirty,false);
    assert.deepEqual(await recovery.list(),[]);
    const nextModel = new Projects(() => [textEffect]);
    nextModel.load(model.snapshot().project);
    assert.deepEqual(nextModel.snapshot().project,await new Files().open(folder));
  } finally { await session.dispose(); }
});

test('Autosave retries after a write failure and does not mark the document explicitly saved', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(),'alert-draft-retry-'));
  let fail = true;
  const model = new Projects(() => [textEffect]);
  const recovery = new RecoveryStore(root,new Files(point=>{if(fail&&point==='before-index')throw Error('Disk error');}));
  const session = new ProjectSession(model,recovery,()=>{},new Files(),60000);
  try {
    model.dispatch({type:'add',effect:'text'});session.changed();
    await assert.rejects(session.flushDraft(),/Disk error/);
    assert.equal(session.status().autosave,'error');assert.equal(model.snapshot().dirty,true);
    fail = false;
    await session.flushDraft();
    assert.equal(session.status().autosave,'saved');
    assert.equal(model.snapshot().dirty,true);
    assert.equal((await recovery.list()).length,1);
  } finally { fail=false;await session.dispose(); }
});

test('Edits arriving during autosave are serialized and the latest draft wins', async () => {
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'alert-draft-queue-'));
  let release!:()=>void, started!:()=>void;
  const gate=new Promise<void>(resolve=>{release=resolve;});
  const writing=new Promise<void>(resolve=>{started=resolve;});
  class SlowRecovery extends RecoveryStore {
    private first=true;
    override async save(...args:Parameters<RecoveryStore['save']>) {
      if(this.first){this.first=false;started();await gate;}
      return super.save(...args);
    }
  }
  const model=new Projects(()=>[textEffect]);
  const recovery=new SlowRecovery(root);
  const session=new ProjectSession(model,recovery,()=>{},new Files(),60000);
  try {
    model.dispatch({type:'add',effect:'text'});session.changed();
    const first=session.flushDraft();await writing;
    const id=model.snapshot().project.objects[0].id;
    model.dispatch({type:'set',id,key:'content',value:'Latest edit'});session.changed();
    const second=session.flushDraft();release();await Promise.all([first,second]);
    const project=await recovery.open(model.snapshot().project.id);
    assert.equal(project.objects[0].settings.content,'Latest edit');
    assert.equal(session.status().autosave,'saved');
    assert.equal(model.snapshot().dirty,true);
  } finally { release();await session.dispose(); }
});
