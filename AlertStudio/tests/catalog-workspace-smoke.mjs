import {_electron as electron,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
import {resizeWindow,waitForCanvasFit,isolateDesktopPointer} from './window-helpers.mjs';
const data=path.resolve(`.test-data/catalog-${randomUUID()}`);await mkdir(data,{recursive:true});await mkdir('artifacts/screenshots',{recursive:true});
const env={...process.env,ALERT_STUDIO_DATA:data};delete env.ELECTRON_RUN_AS_NODE;
const errors=[];let app;
function groupFor(value,id){
  if(!value||typeof value!=='object')return undefined;
  if(Array.isArray(value.views)&&value.views.includes(id))return value.id;
  for(const child of Object.values(value)){const group=groupFor(child,id);if(group)return group;}
}
try{
  app=await electron.launch({args:['.'],env});const page=await app.firstWindow();page.setDefaultTimeout(10000);page.on('pageerror',error=>errors.push(error.message));
  await isolateDesktopPointer(app,page);
  await page.getByRole('button',{name:'Создать проект →'}).click();
  const state=()=>page.evaluate(()=>window.studio.snapshot()),initial=await state();
  const independent=page.locator('[data-category="independent"]'),linked=page.locator('[data-category="linked"]');
  await expect(independent.getByRole('button')).toHaveCount(2);await expect(linked.getByRole('button')).toHaveCount(3);
  await expect(independent.getByRole('button',{name:'Текст +',exact:true})).toBeVisible();
  await expect(independent.getByRole('button',{name:'Туман +',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Распределить объекты',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Распределить объекты',exact:true});
  await dialog.getByLabel('Раздел: Текст',{exact:true}).selectOption('linked');
  await dialog.getByLabel('Раздел: Мелкие звёзды',{exact:true}).selectOption('independent');
  await page.screenshot({path:'artifacts/screenshots/catalog-sections-dialog.png'});
  await dialog.getByRole('button',{name:'Закрыть',exact:true}).click();
  await expect(independent.getByRole('button',{name:'Мелкие звёзды +',exact:true})).toBeVisible();
  await expect(linked.getByRole('button',{name:'Текст +',exact:true})).toBeVisible();assert.deepEqual(await state(),initial);
  await independent.getByRole('button',{name:'Мелкие звёзды +',exact:true}).click();
  await expect(page.getByLabel('Источник тумана',{exact:true})).toHaveValue('');
  await expect(page.locator('.canvas-diagnostics')).toContainText('Проверьте связи');
  await page.getByRole('button',{name:'Отменить',exact:true}).click();
  await page.getByRole('button',{name:'Туман +',exact:true}).click();
  const beforePanels=await state();
  assert.equal(await page.locator('.tool-rail').getByRole('button',{name:/↗/}).count(),0);
  for(const label of ['Слои','Свойства','Холст']){
    await expect(page.getByRole('button',{name:`${label} +`,exact:true})).toHaveCount(1);
    await expect(page.getByRole('button',{name:`${label} ↗`,exact:true})).toHaveCount(1);
  }
  const layout=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('alert-studio-workspace')));
  const original=await layout(),managerId=Object.keys(original.panels).find(id=>original.panels[id].params?.type==='panel-manager');
  assert.ok(managerId);const originalGroup=groupFor(original.grid,managerId);
  await resizeWindow(app,page,1920,1080);await waitForCanvasFit(page);
  await page.getByRole('tab',{name:'Панели',exact:true}).dragTo(page.getByRole('tab',{name:'Слои',exact:true}),{targetPosition:{x:20,y:10}});
  await expect.poll(async()=>groupFor((await layout()).grid,managerId)).not.toBe(originalGroup);
  const movedGroup=groupFor((await layout()).grid,managerId);assert.deepEqual(await state(),beforePanels);
  await page.reload();await expect(page.getByRole('button',{name:'Мелкие звёзды +',exact:true})).toBeVisible();
  await expect(independent.getByRole('button',{name:'Мелкие звёзды +',exact:true})).toBeVisible();
  assert.equal(groupFor((await layout()).grid,managerId),movedGroup);assert.deepEqual(await state(),beforePanels);
  await page.getByRole('button',{name:'Панели',exact:true}).click();
  const manager=page.locator('.panel-manager');
  const childPromise=app.waitForEvent('window');await manager.getByRole('button',{name:'Свойства ↗',exact:true}).click();
  const child=await childPromise;
  await expect(child.getByLabel('Центр X',{exact:true})).toHaveValue('960');await child.close();
  await manager.getByRole('button',{name:'Холст +',exact:true}).click();
  await expect(page.getByRole('tab',{name:'Холст',exact:true})).toHaveCount(2);
  await page.getByRole('button',{name:'Панели',exact:true}).click();
  await page.getByRole('tab',{name:'Панели',exact:true}).locator('.dv-default-tab-action').click();
  await expect(manager).toHaveCount(0);
  await page.reload();await expect(page.getByRole('button',{name:'Туман +',exact:true})).toBeVisible();await expect(manager).toHaveCount(0);
  await page.getByRole('button',{name:'Панели',exact:true}).click();await expect(manager).toBeVisible();
  await expect(page.getByRole('tab',{name:'Панели',exact:true})).toHaveCount(1);
  // Simulate a pre-upgrade workspace: the layout is retained and the new controls are added once.
  await page.getByRole('tab',{name:'Панели',exact:true}).locator('.dv-default-tab-action').click();
  const legacy=await layout();await page.evaluate(()=>localStorage.removeItem('alert-studio-panel-manager-v1'));
  await page.reload();await expect(manager).toBeVisible();
  for(const [id,panel] of Object.entries(legacy.panels))assert.deepEqual((await layout()).panels[id],panel);
  await page.getByRole('button',{name:'Сбросить рабочую область',exact:true}).click();
  await expect(page.getByRole('tab',{name:'Холст',exact:true})).toHaveCount(1);await expect(manager).toBeVisible();
  await expect(independent.getByRole('button',{name:'Мелкие звёзды +',exact:true})).toBeVisible();assert.deepEqual(await state(),beforePanels);
  for(const [width,height,label] of [[1920,1080,'1080'],[900,650,'compact']]){
    await resizeWindow(app,page,width,height);await waitForCanvasFit(page);
    await manager.getByRole('button',{name:'Свойства ↗',exact:true}).scrollIntoViewIfNeeded();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await page.screenshot({path:`artifacts/screenshots/catalog-workspace-${label}.png`});
  }
  await page.getByRole('button',{name:'Распределить объекты',exact:true}).click();await dialog.getByRole('button',{name:'Сбросить разделы',exact:true}).click();
  await dialog.getByRole('button',{name:'Закрыть',exact:true}).click();await expect(independent.getByRole('button',{name:'Текст +',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'RU',exact:true}).click();await expect(page.getByRole('button',{name:'Organize objects',exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Independent',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Panels',exact:true}).click();await expect(manager.getByRole('button',{name:'Properties ↗',exact:true})).toBeVisible();
  assert.deepEqual(errors,[]);
  await writeFile('artifacts/catalog-workspace-ui-results.json',JSON.stringify({date:new Date().toISOString(),
    tests:['default categories','user categorization and reset','preferences survive reload without project edits','category does not change sources',
      'single panel controls','native tab drag and layout restore','detached window','additional embedded canvas','close/reopen panel controls','legacy layout upgrade','workspace reset preserves catalog','RU/EN','900x650 and 1920x1080'],errors},null,2));
  console.log('Catalog and workspace management Electron smoke passed');
}finally{if(app){for(const page of app.windows())await page.screenshot({path:'artifacts/screenshots/catalog-workspace-last.png'}).catch(()=>{});await app.evaluate(({app})=>app.exit(0)).catch(()=>{});await app.close().catch(()=>{});}}
