import {test} from 'node:test';
import assert from 'node:assert/strict';
import {catalogItems,catalogGroup,parseCatalogGroups} from '../modules/panels/object-catalog/model';
import {objectTemplates} from '../modules/presets/cloud-network/object-templates';
import {textEffect} from '../modules/effects/text/src/register';
import {fogEffect} from '../modules/effects/fog/src/model';
import {starsEffect} from '../modules/effects/stars/src/model';
import {networkEffect} from '../modules/effects/network/src/model';

test('Catalog categories reflect creation modes, including both star variants and external sources',()=>{
  const items=catalogItems([textEffect,fogEffect,starsEffect,networkEffect],objectTemplates);
  assert.deepEqual(items.map(item=>[item.id,catalogGroup(item,{})]),[
    ['effect:text','independent'],['template:cloud-fog','independent'],['template:cloud-small-stars','linked'],
    ['template:cloud-large-stars','linked'],['template:cloud-network','linked']]);
  const external={...starsEffect,id:'external-stars'};
  assert.equal(catalogGroup(catalogItems([external],[])[0],{}),'independent');
  external.settings=external.settings.map(setting=>setting.id==='fieldMode'?{...setting,default:'cloud'}:setting);
  assert.equal(catalogGroup(catalogItems([external],[])[0],{}),'linked');
});
test('User classification changes only catalog placement, preserves unavailable items and rejects malformed preferences',()=>{
  const items=catalogItems([textEffect,fogEffect,starsEffect,networkEffect],objectTemplates),before=structuredClone(items);
  const preferences=parseCatalogGroups('{"template:cloud-small-stars":"independent","effect:text":"linked","effect:absent":"linked","bad":"linked","effect:fog":"broken"}');
  assert.equal(catalogGroup(items[0],preferences),'linked');assert.equal(catalogGroup(items[2],preferences),'independent');
  assert.equal(items[2].requiresSource,true);assert.deepEqual(items,before);
  assert.equal(parseCatalogGroups(JSON.stringify(preferences))['effect:absent'],'linked');
  for(const raw of [null,'null','[]','false','{broken','{"effect:text":5}'])assert.deepEqual(parseCatalogGroups(raw),{});
});
