import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Projects} from '../core/project/service';
import {textEffect} from '../modules/effects/text/src/register';
import {fogEffect} from '../modules/effects/fog/src/model';
import {validateCommand} from '../adapters/validation-ajv/project';
import {matchesSettingsText,searchSettings,settingChanged,settingActive} from '../core/scene/settings-tools';
import type {Effect} from '../sdk';
import {Files} from '../adapters/storage-files/project';
import {mkdtemp} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
test('Single and whole effect resets preserve unknown settings, identity and editor state and undo atomically',()=>{
  const model=new Projects(()=>[textEffect]);model.dispatch({type:'add',effect:'text'});const id=model.snapshot().selected!;
  const project=model.snapshot().project;project.objects[0].settings.future='retain';model.load(project);model.dispatch({type:'set',id,key:'x',value:100});model.dispatch({type:'set',id,key:'size',value:100});model.dispatch({type:'editor',id,key:'solo',value:true});model.dispatch({type:'layer',id,key:'opacity',value:50});
  const before=model.snapshot().project;model.dispatch(validateCommand({type:'settings-reset',id,scope:'effect',key:'x',revision:model.snapshot().revision}));assert.equal(model.snapshot().project.objects[0].settings.x,textEffect.settings.find(s=>s.id==='x')!.default);assert.equal(model.snapshot().project.objects[0].settings.size,100);
  model.dispatch({type:'undo'});assert.deepEqual(model.snapshot().project,before);
  model.dispatch({type:'settings-reset',id,scope:'effect',key:null,revision:model.snapshot().revision});const after=model.snapshot().project.objects[0];assert.equal(after.settings.future,'retain');assert.deepEqual(after.editor,before.objects[0].editor);assert.deepEqual(after.layer,before.objects[0].layer);for(const s of textEffect.settings)assert.equal(after.settings[s.id],s.default);
  model.dispatch({type:'undo'});assert.deepEqual(model.snapshot().project,before);model.dispatch({type:'redo'});assert.equal(model.snapshot().project.objects[0].settings.future,'retain');
});
test('Reset rejects locked, stale, unknown and missing-version effects without partial mutation; defaults are a no-op',()=>{
  const model=new Projects(()=>[textEffect]);model.dispatch({type:'add',effect:'text'});model.markSaved();const id=model.snapshot().selected!,before=model.snapshot();
  model.dispatch({type:'settings-reset',id,scope:'effect',key:null,revision:before.revision});model.dispatch({type:'settings-reset',id,scope:'layer',key:null,revision:before.revision});assert.deepEqual(model.snapshot(),before);
  assert.throws(()=>model.dispatch({type:'settings-reset',id,scope:'effect',key:'unknown',revision:before.revision}));assert.throws(()=>model.dispatch({type:'settings-reset',id,scope:'layer',key:'version',revision:before.revision}));assert.throws(()=>model.dispatch({type:'settings-reset',id,scope:'effect',key:null,revision:before.revision+1}));assert.deepEqual(model.snapshot(),before);
  model.dispatch({type:'editor',id,key:'locked',value:true});const locked=model.snapshot();assert.throws(()=>model.dispatch({type:'settings-reset',id,scope:'effect',key:null,revision:locked.revision}),/layerLocked/);assert.deepEqual(model.snapshot(),locked);
  const absent=before.project;absent.modules.text='9.0.0';model.load(absent);const missing=model.snapshot();assert.throws(()=>model.dispatch({type:'settings-reset',id,scope:'effect',key:null,revision:missing.revision}));assert.deepEqual(model.snapshot(),missing);
  assert.throws(()=>validateCommand({type:'settings-reset',id,scope:'editor',key:null,revision:0}));
});
test('Appearance reset is independent, restores optional legacy structure and persists through folder storage',async()=>{
  const model=new Projects(()=>[textEffect]);model.dispatch({type:'add',effect:'text'});const id=model.snapshot().selected!;model.dispatch({type:'set',id,key:'x',value:150});model.dispatch({type:'layer',id,key:'blend',value:'screen'});model.dispatch({type:'layer',id,key:'hue',value:80});
  model.dispatch({type:'settings-reset',id,scope:'layer',key:'hue',revision:model.snapshot().revision});assert.equal(model.snapshot().project.objects[0].layer?.blend,'screen');assert.equal(model.snapshot().project.objects[0].layer?.hue,0);
  const before=model.snapshot().project;model.dispatch({type:'settings-reset',id,scope:'layer',key:null,revision:model.snapshot().revision});assert.equal(model.snapshot().project.objects[0].layer,undefined);assert.equal(model.snapshot().project.objects[0].settings.x,150);
  const folder=await mkdtemp(path.join(os.tmpdir(),'alert-reset-')),files=new Files();await files.save(folder,model.snapshot().project);assert.deepEqual(await files.open(folder),model.snapshot().project);model.dispatch({type:'undo'});assert.deepEqual(model.snapshot().project,before);
});
test('Full reset includes hidden values and source links, without touching the source object',()=>{
  const model=new Projects(()=>[fogEffect]);model.dispatch({type:'add',effect:'fog'});const source=model.snapshot().selected!;model.dispatch({type:'add',effect:'fog'});const id=model.snapshot().selected!;model.dispatch({type:'set',id,key:'regionSource',value:source});const before=model.snapshot().project.objects[0];
  model.dispatch({type:'settings-reset',id,scope:'effect',key:null,revision:model.snapshot().revision});assert.equal(model.snapshot().project.objects[1].settings.regionSource,'');assert.deepEqual(model.snapshot().project.objects[0],before);
});
test('Search is bilingual and includes hidden parameters with recursive activating controls; changed-only ignores absent defaults',()=>{
  const effect:Effect={...textEffect,settings:[...textEffect.settings,{id:'mode',type:'select',default:'off',options:[{value:'off',label:{ru:'Выкл',en:'Off'}},{value:'on',label:{ru:'Вкл',en:'On'}}],unit:'',animatable:false,label:{ru:'Режим',en:'Mode'}},{id:'nested',type:'string',default:'off',unit:'',animatable:false,label:{ru:'Вложенный',en:'Nested'},when:{key:'mode',equals:'on'}},{id:'sparkle',type:'number',default:1,min:0,max:5,unit:'',animatable:false,label:{ru:'Зелёные искры',en:'Green sparks'},when:{key:'nested',equals:'on'}}]};
  const model=new Projects(()=>[effect]);model.dispatch({type:'add',effect:'text'});const object=model.snapshot().project.objects[0];assert.equal(searchSettings(object,effect,'',false).settings.some(s=>s.id==='sparkle'),false);
  const found=searchSettings(object,effect,'ЗЕЛЕНЫЕ искры',false);assert.deepEqual(found.matches.map(s=>s.id),['sparkle']);assert.ok(found.settings.some(s=>s.id==='mode'));assert.ok(found.settings.some(s=>s.id==='nested'));assert.equal(settingActive(object,effect,found.matches[0]),false);
  assert.equal(searchSettings(object,effect,'green sparks',false).matches[0].id,'sparkle');assert.deepEqual(searchSettings(object,effect,'',true).matches,[]);delete object.settings.x;assert.equal(settingChanged(object,effect.settings.find(s=>s.id==='x')!),false);assert.equal(matchesSettingsText(' no match ','width'),false);
});
