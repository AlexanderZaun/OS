import {appCommand,ensurePanelManager} from './menu-helpers.mjs';
import {_electron as electron,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
import {resizeWindow,waitForCanvasFit,isolateDesktopPointer} from './window-helpers.mjs';
const data=path.resolve(`.test-data/catalog-panel-${randomUUID()}`);await mkdir(data,{recursive:true});await mkdir('artifacts/screenshots',{recursive:true});
const env={...process.env,ALERT_STUDIO_DATA:data};delete env.ELECTRON_RUN_AS_NODE;
let app;const errors=[];
function groupFor(value,id){
  if(!value||typeof value!=='object')return undefined;
  if(Array.isArray(value.views)&&value.views.includes(id))return value.id;
  for(const child of Object.values(value)){const group=groupFor(child,id);if(group)return group;}
}
try{
  app=await electron.launch({args:['.'],env});const page=await app.firstWindow();page.setDefaultTimeout(10000);page.on('pageerror',error=>errors.push(error.message));
  await isolateDesktopPointer(app,page);await page.getByRole('button',{name:'Создать проект →'}).click();await ensurePanelManager(page);
  await expect(page.getByRole('tab',{name:'Объекты',exact:true})).toHaveCount(1);
  await expect(page.locator('.tool-rail')).toHaveCount(0);
  const state=()=>page.evaluate(()=>window.studio.snapshot()),before=await state();
  const catalogId=await page.getByRole('tab',{name:'Объекты',exact:true}).getAttribute('data-tab-panel-id');
  await page.getByRole('tab',{name:'Объекты',exact:true}).dragTo(page.getByRole('tab',{name:'Слои',exact:true}),{targetPosition:{x:20,y:10}});
  await expect.poll(async()=>{
    const current=await page.evaluate(()=>JSON.parse(localStorage.getItem('alert-studio-workspace')));
    const group=groupFor(current.grid,catalogId);return !!group&&group===groupFor(current.grid,'layers-1');
  }).toBe(true);
  const layout=await page.evaluate(()=>localStorage.getItem('alert-studio-workspace'));
  await page.reload();await expect(page.getByRole('tab',{name:'Объекты',exact:true})).toHaveCount(1);
  await expect(page.getByRole('button',{name:'Текст +',exact:true})).toBeVisible();
  assert.deepEqual(await state(),before);
  // A separate catalog edits the shared project and synchronizes category preferences.
  const windowPromise=app.waitForEvent('window');await page.getByRole('button',{name:'Объекты ↗',exact:true}).click();const child=await windowPromise;
  child.on('pageerror',error=>errors.push(error.message));
  await child.getByRole('button',{name:'Распределить объекты',exact:true}).click();
  await child.getByRole('dialog').getByLabel('Раздел: Мелкие звёзды',{exact:true}).selectOption('independent');
  await child.getByRole('dialog').getByRole('button',{name:'Закрыть',exact:true}).click();
  await expect(page.locator('[data-category="independent"]').getByRole('button',{name:'Мелкие звёзды +',exact:true})).toBeVisible();
  assert.deepEqual(await state(),before);
  await child.getByRole('button',{name:'Текст +',exact:true}).click();
  await expect.poll(async()=>(await state()).project.objects.length).toBe(1);
  const added=await state();assert.deepEqual(await child.evaluate(()=>window.studio.snapshot()),added);
  await child.close();
  await page.getByRole('tab',{name:'Объекты',exact:true}).locator('.dv-default-tab-action').click();
  await page.reload();await expect(page.getByRole('tab',{name:'Объекты',exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Объекты +',exact:true}).click();await expect(page.getByRole('tab',{name:'Объекты',exact:true})).toHaveCount(1);
  await expect(page.locator('[data-category="independent"]').getByRole('button',{name:'Мелкие звёзды +',exact:true})).toBeVisible();
  // The previous fixed-sidebar version had no catalog panel in its saved layout.
  await page.getByRole('tab',{name:'Объекты',exact:true}).locator('.dv-default-tab-action').click();
  const legacy=await page.evaluate(()=>JSON.parse(localStorage.getItem('alert-studio-workspace')));
  await page.evaluate(()=>localStorage.removeItem('alert-studio-object-catalog-v1'));await page.reload();
  await expect(page.getByRole('tab',{name:'Объекты',exact:true})).toHaveCount(1);
  const upgraded=await page.evaluate(()=>JSON.parse(localStorage.getItem('alert-studio-workspace')));
  for(const [id,panel] of Object.entries(legacy.panels))assert.deepEqual(upgraded.panels[id],panel);
  assert.deepEqual(await state(),added);
  // Inspect the initial layout after exercising arbitrary user docking and migration.
  await appCommand(page,'Сбросить рабочую область');
  await expect(page.getByRole('tab',{name:'Объекты',exact:true})).toHaveCount(1);
  for(const [width,height,label] of [[1920,1080,'1080'],[900,650,'compact']]){
    await resizeWindow(app,page,width,height);await waitForCanvasFit(page);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await page.screenshot({path:`artifacts/screenshots/object-catalog-panel-${label}.png`});
  }
  await appCommand(page,'RU');await expect(page.getByRole('tab',{name:'Objects',exact:true})).toHaveCount(1);
  assert.deepEqual(errors,[]);
  await writeFile('artifacts/object-catalog-panel-ui-results.json',JSON.stringify({date:new Date().toISOString(),
    tests:['catalog is a docked panel','native tab drag and reload','detached catalog adds to shared project','cross-window category synchronization','close persists and manager reopens catalog','legacy workspace upgrade','RU/EN','900x650 and 1920x1080'],layout,errors},null,2));
  console.log('Dockable object catalog Electron smoke passed');
}finally{if(app){await app.evaluate(({app})=>app.exit(0)).catch(()=>{});await app.close().catch(()=>{});}}
