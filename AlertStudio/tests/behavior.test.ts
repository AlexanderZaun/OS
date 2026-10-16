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
