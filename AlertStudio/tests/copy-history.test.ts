import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Projects} from '../core/project/service';
import {textEffect} from '../modules/effects/text/src/register';
import {fogEffect} from '../modules/effects/fog/src/model';
import {pasteKeys} from '../core/scene/paste-keys';
import {validateCommand} from '../adapters/validation-ajv/project';
function textPair(){const model=new Projects(()=>[textEffect,fogEffect]);model.dispatch({type:'add',effect:'text'});const a=model.snapshot().selected!;model.dispatch({type:'add',effect:'text'});return {model,a,b:model.snapshot().selected!};}
test('Copy is a frozen shared buffer, does not dirty or change history, and paste is one atomic undo step',()=>{
  const {model,a,b}=textPair();model.dispatch({type:'set',id:a,key:'size',value:100});model.dispatch({type:'set',id:b,key:'x',value:300});model.markSaved();const before=model.snapshot();
  model.dispatch({type:'settings-copy',id:a});assert.equal(model.snapshot().dirty,false);assert.deepEqual(model.snapshot().history,before.history);
  const buffer=model.snapshot().clipboard!;buffer.values!.size=150;assert.equal(model.snapshot().clipboard?.values?.size,100);
  model.dispatch({type:'set',id:a,key:'size',value:120});const prePaste=model.snapshot(),keys=pasteKeys(textEffect,model.snapshot().clipboard!.values!,prePaste.project.objects[1].settings,false,false);
  assert.ok(!keys.includes('x'));model.dispatch(validateCommand({type:'settings-paste',id:b,keys,appearance:false,revision:prePaste.revision}));assert.equal(model.snapshot().project.objects[1].settings.size,100);assert.equal(model.snapshot().project.objects[1].settings.x,300);assert.equal(model.snapshot().history!.past.length,prePaste.history!.past.length+1);
  model.dispatch({type:'undo'});assert.deepEqual(model.snapshot().project,prePaste.project);model.dispatch({type:'redo'});assert.equal(model.snapshot().project.objects[1].settings.size,100);
});
test('Appearance can cross types, effect paste rejects incompatible/locked/stale targets, and failure preserves all state',()=>{
  const {model,a,b}=textPair();model.dispatch({type:'layer',id:a,key:'hue',value:70});model.dispatch({type:'settings-copy',id:a});model.dispatch({type:'add',effect:'fog'});const fog=model.snapshot().selected!;
  const before=model.snapshot();assert.throws(()=>model.dispatch({type:'settings-paste',id:fog,keys:['size'],appearance:true,revision:before.revision}),/settingsPasteIncompatible/);assert.deepEqual(model.snapshot(),before);
  model.dispatch({type:'settings-paste',id:fog,keys:[],appearance:true,revision:model.snapshot().revision});assert.equal(model.snapshot().project.objects.at(-1)!.layer?.hue,70);
  model.dispatch({type:'editor',id:b,key:'locked',value:true});const locked=model.snapshot();assert.throws(()=>model.dispatch({type:'settings-paste',id:b,keys:['size'],appearance:true,revision:locked.revision}),/layerLocked/);assert.deepEqual(model.snapshot(),locked);
  assert.throws(()=>model.dispatch({type:'settings-paste',id:a,keys:['unknown'],appearance:true,revision:model.snapshot().revision}));assert.throws(()=>model.dispatch({type:'settings-paste',id:a,keys:['size'],appearance:true,revision:0}));assert.deepEqual(model.snapshot(),locked);
  assert.throws(()=>validateCommand({type:'settings-paste',id:a,keys:['size','size'],appearance:false,revision:0}));
});
test('Copy from a locked layer is allowed; defaults pasted onto defaults are a no-op; load clears session-only data',()=>{
  const {model,a,b}=textPair();model.dispatch({type:'editor',id:a,key:'locked',value:true});model.dispatch({type:'settings-copy',id:a});const before=model.snapshot();model.dispatch({type:'settings-paste',id:b,keys:['size'],appearance:true,revision:before.revision});assert.deepEqual(model.snapshot(),before);
  model.load(before.project);assert.equal(model.snapshot().clipboard,null);assert.deepEqual(model.snapshot().history?.past,[]);assert.deepEqual(model.snapshot().history?.future,[]);assert.throws(()=>model.dispatch({type:'settings-paste',id:b,keys:[],appearance:true,revision:model.snapshot().revision}),/settingsClipboardEmpty/);
});
test('Link and coordinate defaults preserve target modes; explicit invalid links reject the entire paste including appearance',()=>{
  const model=new Projects(()=>[fogEffect]);model.dispatch({type:'add',effect:'fog'});const a=model.snapshot().selected!;model.dispatch({type:'add',effect:'fog'});const b=model.snapshot().selected!;
  model.dispatch({type:'set',id:a,key:'regionMode',value:'source'});model.dispatch({type:'set',id:a,key:'regionSource',value:b});model.dispatch({type:'layer',id:a,key:'opacity',value:30});model.dispatch({type:'settings-copy',id:a});
  const buffer=model.snapshot().clipboard!,keys=pasteKeys(fogEffect,buffer.values!,model.snapshot().project.objects[1].settings,false,false);for(const key of ['regionMode','regionSource','x','y','regionOffsetX','regionOffsetY'])assert.ok(!keys.includes(key));
  const before=model.snapshot();assert.throws(()=>model.dispatch({type:'settings-paste',id:b,keys:['regionMode','regionSource'],appearance:true,revision:before.revision}),/settingsPasteLinksInvalid/);assert.deepEqual(model.snapshot(),before);
  model.dispatch({type:'set',id:a,key:'regionSource',value:''});model.dispatch({type:'set',id:b,key:'regionSource',value:a});model.dispatch({type:'settings-copy',id:b});const cycle=model.snapshot();assert.throws(()=>model.dispatch({type:'settings-paste',id:a,keys:['regionSource'],appearance:false,revision:cycle.revision}),/settingsPasteLinksInvalid/);assert.deepEqual(model.snapshot(),cycle);
  model.dispatch({type:'remove',id:a});const deleted=model.snapshot();assert.throws(()=>model.dispatch({type:'settings-paste',id:b,keys:['regionSource'],appearance:false,revision:deleted.revision}),/settingsPasteLinksInvalid/);assert.deepEqual(model.snapshot(),deleted);
});
test('History jumps restore exact projects with one revision, respect saved state, and a new edit removes the redo branch',()=>{
  const {model,b}=textPair();model.markSaved();const saved=model.snapshot(),savedId=saved.history!.past.at(-1)!.id;
  model.dispatch({type:'set',id:b,key:'size',value:90});const middle=model.snapshot();model.dispatch({type:'rename',id:b,name:'Latest'});const latest=model.snapshot(),lastId=latest.history!.past.at(-1)!.id;
  model.dispatch({type:'history-jump',target:savedId,revision:latest.revision});assert.deepEqual(model.snapshot().project,saved.project);assert.equal(model.snapshot().dirty,false);assert.equal(model.snapshot().revision,latest.revision+1);assert.equal(model.snapshot().history!.future.length,2);
  model.dispatch({type:'history-jump',target:lastId,revision:model.snapshot().revision});assert.deepEqual(model.snapshot().project,latest.project);
  model.dispatch({type:'history-jump',target:middle.history!.past.at(-1)!.id,revision:model.snapshot().revision});model.dispatch({type:'set',id:b,key:'size',value:95});assert.deepEqual(model.snapshot().history!.future,[]);const before=model.snapshot();assert.throws(()=>model.dispatch({type:'history-jump',target:lastId,revision:before.revision}),/historyUnavailable/);assert.deepEqual(model.snapshot(),before);
});
test('History retains 100 steps, trims labels with states, excludes no-ops and copy, and supports its available base',()=>{
  const {model,b}=textPair();for(let i=0;i<110;i++)model.dispatch({type:'rename',id:b,name:`Layer ${i}`});assert.equal(model.snapshot().history!.past.length,100);
  const latest=model.snapshot();model.dispatch({type:'rename',id:b,name:'Layer 109'});assert.deepEqual(model.snapshot(),latest);
  model.dispatch({type:'history-jump',target:null,revision:latest.revision});assert.equal(model.snapshot().history!.past.length,0);assert.equal(model.snapshot().history!.future.length,100);assert.equal(model.snapshot().project.objects[1].name,'Layer 9');
  model.dispatch({type:'history-jump',target:latest.history!.past.at(-1)!.id,revision:model.snapshot().revision});assert.deepEqual(model.snapshot().project,latest.project);
  const before=model.snapshot();assert.throws(()=>model.dispatch({type:'history-jump',target:null,revision:0}));assert.deepEqual(model.snapshot(),before);
});
