import {_electron as electron,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
import {resizeWindow,waitForCanvasFit} from './window-helpers.mjs';
const data=path.resolve(`.test-data/templates-${randomUUID()}`);
await mkdir(data,{recursive:true});await mkdir('artifacts/screenshots',{recursive:true});
const example=JSON.parse(await readFile('modules/presets/cloud-network/layers.json','utf8'));
const env={...process.env,ALERT_STUDIO_DATA:data};delete env.ELECTRON_RUN_AS_NODE;
let app;const errors=[];
try{
  app=await electron.launch({args:['.'],env});const page=await app.firstWindow();page.setDefaultTimeout(10000);
  page.on('pageerror',error=>errors.push(error.message));
  await page.getByRole('button',{name:'Создать проект →'}).click();
  const state=()=>page.evaluate(()=>window.studio.snapshot());
  const properties=page.locator('.properties-panel');
  const sourceIsFirst=async(label)=>{
    await expect(properties.locator('input,select').first()).toHaveAttribute('aria-label',label);
    const visible=await properties.getByLabel(label,{exact:true}).evaluate(element=>{
      const rect=element.getBoundingClientRect(),panel=element.closest('.properties-panel').getBoundingClientRect();
      return rect.top>=panel.top&&rect.bottom<=panel.bottom;
    });
    assert.ok(visible,'Source selector is visible at the top without scrolling');
  };
  async function add(button,layerId,count){
    await page.getByRole('button',{name:button,exact:true}).click();
    await expect.poll(async()=>(await state()).project.objects.length).toBe(count);
    const snapshot=await state(),object=snapshot.project.objects.find(o=>o.id===snapshot.selected);
    for(const [key,value] of Object.entries(example.find(layer=>layer.id===layerId).values)){
      assert.equal(object.settings[key],typeof value==='string'&&value.startsWith('$')?'':value);
    }
    return object;
  }
  const fog=await add('Туман +','fog0',1);
  // Scroll an earlier object first: changing selection must show the new object's source controls.
  await properties.getByLabel('Контраст текстуры',{exact:true}).scrollIntoViewIfNeeded();
  const small=await add('Мелкие звёзды +','small',2);
  await sourceIsFirst('Источник тумана');
  await expect(page.locator('.canvas-diagnostics')).toContainText('Проверьте связи');
  await properties.getByLabel('Источник тумана',{exact:true}).selectOption(fog.id);
  await expect(page.locator('.canvas-diagnostics')).toHaveCount(0);
  const large=await add('Крупные звёзды +','large',3);
  await sourceIsFirst('Источник тумана');await properties.getByLabel('Источник тумана',{exact:true}).selectOption(fog.id);
  await expect(page.locator('.canvas-diagnostics')).toHaveCount(0);
  const network=await add('Сеть звёзд +','network',4);
  await sourceIsFirst('Источник звёзд');await properties.getByLabel('Источник звёзд',{exact:true}).selectOption(large.id);
  await expect(page.locator('.canvas-diagnostics')).toHaveCount(0);
  const linked=(await state()).project;
  await page.getByRole('button',{name:'Отменить',exact:true}).click();
  await expect(properties.getByLabel('Источник звёзд',{exact:true})).toHaveValue('');
  await page.getByRole('button',{name:'Повторить',exact:true}).click();
  await expect(properties.getByLabel('Источник звёзд',{exact:true})).toHaveValue(large.id);
  await page.getByLabel('Время (секунды)',{exact:true}).fill('6');
  for(const [width,height,label] of [[1920,1080,'1080'],[900,650,'compact']]){
    await resizeWindow(app,page,width,height);await waitForCanvasFit(page);
    await sourceIsFirst('Источник звёзд');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await page.screenshot({path:`artifacts/screenshots/object-templates-${label}.png`});
  }
  const childPromise=app.waitForEvent('window');await page.getByRole('button',{name:'Свойства ↗',exact:true}).click();
  const child=await childPromise;await expect(child.locator('.properties-links').getByLabel('Источник звёзд',{exact:true})).toHaveValue(large.id);
  await child.getByLabel('Источник звёзд',{exact:true}).selectOption(small.id);
  await expect(properties.getByLabel('Источник звёзд',{exact:true})).toHaveValue(small.id);
  await page.getByRole('button',{name:'Отменить',exact:true}).click();
  await expect(child.getByLabel('Источник звёзд',{exact:true})).toHaveValue(large.id);await child.close();
  const folder=path.join(data,'Project');await mkdir(folder);
  await app.evaluate(({dialog},folder)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[folder]});},folder);
  await page.getByRole('button',{name:'Сохранить',exact:true}).click();await page.waitForFunction(async()=>!(await window.studio.snapshot()).dirty);
  await page.getByRole('button',{name:'Открыть',exact:true}).click();await page.waitForFunction(async()=>(await window.studio.snapshot()).selected===null);
  await expect(page.getByRole('button',{name:'Сохранить',exact:true})).toBeEnabled();
  assert.deepEqual((await state()).project,linked);
  await page.getByRole('button',{name:'RU',exact:true}).click();
  await expect(page.getByRole('button',{name:'Small stars +',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Large stars +',exact:true})).toBeVisible();
  await page.evaluate(id=>window.studio.command({type:'select',id}),network.id);
  await expect(properties.locator('summary').first()).toHaveText('Source links');
  await sourceIsFirst('Stars source');assert.deepEqual(errors,[]);
  await writeFile('artifacts/object-templates-ui-results.json',JSON.stringify({date:new Date().toISOString(),
    tests:['one object per button','example values','two independent star variants','empty sources require manual choice',
      'sources first and selection scroll reset','link undo/redo','detached source editing','folder save/open','RU/EN','900x650 and 1920x1080'],errors},null,2));
  console.log('Object creation templates Electron smoke passed');
}finally{
  if(app){await app.evaluate(({app})=>app.exit(0)).catch(()=>{});await app.close().catch(()=>{});}
}
