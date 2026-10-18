import {_electron as electron,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
import {menuCommand,appCommand} from './menu-helpers.mjs';
import {resizeWindow,isolateDesktopPointer} from './window-helpers.mjs';
const data=path.resolve(`.test-data/settings-tools-${randomUUID()}`);await mkdir(data,{recursive:true});await mkdir('artifacts/screenshots',{recursive:true});
const env={...process.env,ALERT_STUDIO_DATA:data};delete env.ELECTRON_RUN_AS_NODE;let app;const errors=[];
try{
  app=await electron.launch({args:['.'],env});const page=await app.firstWindow();page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(e.message));await isolateDesktopPointer(app,page);
  await page.getByRole('button',{name:'Создать проект →'}).click();await page.getByRole('button',{name:'Текст +',exact:true}).click();
  const state=()=>page.evaluate(()=>window.studio.snapshot()),properties=page.locator('.properties-panel'),search=()=>properties.getByRole('searchbox',{name:'Найти настройки',exact:true});
  const baseline=await state(),id=baseline.selected;
  await properties.getByRole('button',{name:'Найти настройки',exact:true}).click();
  await search().fill('POSITION X');await expect(page.getByLabel('Положение X',{exact:true})).toBeVisible();await expect(page.getByLabel('Положение Y',{exact:true})).toHaveCount(0);assert.deepEqual(await state(),baseline);
  await page.getByLabel('Положение X',{exact:true}).fill('320');await expect(properties.locator('[data-setting="x"]')).toHaveAttribute('data-modified','true');
  await properties.getByRole('button',{name:'Сбросить параметр: Положение X',exact:true}).click();await expect(page.getByLabel('Положение X',{exact:true})).toHaveValue('960');await expect(properties.locator('[data-setting="x"]')).not.toHaveAttribute('data-modified','true');
  await menuCommand(page,'edit','Отменить');await expect(page.getByLabel('Положение X',{exact:true})).toHaveValue('320');
  await search().fill('does not exist');await expect(properties.getByText('Подходящих параметров нет',{exact:true})).toBeVisible();await properties.getByRole('button',{name:'Очистить поиск и фильтр',exact:true}).click();
  await page.getByLabel('Размер текста',{exact:true}).fill('100');
  await properties.getByRole('button',{name:/^Изменено:/}).click();await expect(page.getByLabel('Положение X',{exact:true})).toBeVisible();await expect(page.getByLabel('Положение Y',{exact:true})).toHaveCount(0);
  const beforeBulk=(await state()).project;
  await properties.getByRole('button',{name:'Сброс…',exact:true}).click();let dialog=page.getByRole('dialog',{name:'Сброс параметров',exact:true});await expect(dialog).toContainText('положение и связи');await page.keyboard.press('Escape');assert.deepEqual((await state()).project,beforeBulk);
  await properties.getByRole('button',{name:'Сброс…',exact:true}).click();await dialog.getByRole('button',{name:/^Сбросить эффект/}).click();await expect(page.getByText('Подходящих параметров нет',{exact:true})).toBeVisible();
  await menuCommand(page,'edit','Отменить');assert.deepEqual((await state()).project,beforeBulk);
  await properties.getByRole('button',{name:/^Изменено:/}).click();await search().fill('Layer opacity');const opacity=page.getByLabel('Непрозрачность слоя',{exact:true});await expect(opacity).toBeVisible();await opacity.fill('40');await opacity.press('Enter');await expect(properties.locator('[data-layer-setting="opacity"]')).toHaveAttribute('data-modified','true');
  await properties.getByRole('button',{name:'Сбросить параметр: Непрозрачность слоя',exact:true}).click();await expect(opacity).toHaveValue('100');await menuCommand(page,'edit','Отменить');await expect(opacity).toHaveValue('40');
  await properties.getByRole('button',{name:'Сброс…',exact:true}).click();await dialog.getByRole('button',{name:/^Сбросить оформление/}).click();assert.equal((await state()).project.objects[0].layer,undefined);assert.equal((await state()).project.objects[0].settings.x,320);
  await page.locator('.layers-panel').getByRole('button',{name:'Блокировка слоя',exact:true}).click();await expect(properties.getByRole('button',{name:'Сброс…',exact:true})).toBeDisabled();await search().fill('position x');await expect(page.getByLabel('Положение X',{exact:true})).toBeDisabled();await expect(properties.getByRole('button',{name:'Сбросить параметр: Положение X',exact:true})).toBeDisabled();
  await page.getByRole('button',{name:'Разблокировать слой',exact:true}).click();
  // Hidden fields are found with their activating control, and source selection stays first.
  await page.getByRole('button',{name:'Туман +',exact:true}).click();const source=(await state()).selected;await page.getByRole('button',{name:'Туман +',exact:true}).click();const fog=(await state()).selected;
  await properties.getByRole('button',{name:'Найти настройки',exact:true}).click();
  await search().fill('regionSource');const sourceField=properties.locator('[data-setting="regionSource"]'),sourceSelect=sourceField.locator('select');await expect(sourceSelect).toBeDisabled();await expect(sourceField).toContainText('Доступно при');const mode=properties.locator('[data-setting="regionMode"] select');await mode.selectOption('source');await expect(sourceSelect).toBeEnabled();await sourceSelect.selectOption(source);
  await mode.selectOption('independent');await expect(sourceSelect).toBeDisabled();await sourceField.getByRole('button',{name:/^Сбросить параметр:/}).click();await expect.poll(async()=>(await state()).project.objects.find(o=>o.id===fog).settings.regionSource).toBe('');
  await search().press('Escape');await expect(search()).toHaveValue('');assert.equal(await properties.locator('summary').first().textContent(),'Связи с объектами');
  // Search is per-view; edits and modified markers are shared.
  await search().fill('Center X');const childPromise=app.waitForEvent('window');await menuCommand(page,'window','Свойства ↗');const child=await childPromise;child.on('pageerror',e=>errors.push(e.message));await child.getByRole('button',{name:'Найти настройки',exact:true}).click();await expect(child.getByRole('searchbox',{name:'Найти настройки',exact:true})).toHaveValue('');await child.getByRole('searchbox',{name:'Найти настройки',exact:true}).fill('Center X');await child.getByLabel('Центр X',{exact:true}).fill('200');await expect(page.getByLabel('Центр X',{exact:true})).toHaveValue('200');await child.close();
  for(const [width,height]of [[900,650],[1920,1080]]){await resizeWindow(app,page,width,height);await page.screenshot({path:`artifacts/screenshots/settings-tools-${width}.png`});assert.equal(await properties.evaluate(e=>e.scrollWidth>e.clientWidth),false);await properties.getByRole('button',{name:'Сброс…',exact:true}).click();await page.screenshot({path:`artifacts/screenshots/settings-reset-${width}.png`});await page.keyboard.press('Escape');}
  await properties.getByRole('button',{name:'Сброс…',exact:true}).click();const mainWindow=await app.browserWindow(page);await mainWindow.evaluate(w=>w.close());await expect(page.getByRole('dialog')).toHaveCount(1);await expect(page.getByRole('dialog')).toContainText('Закрыть AlertStudio');await page.getByRole('dialog').getByRole('button',{name:'Отмена',exact:true}).click();
  await appCommand(page,'RU');await expect(properties.getByRole('searchbox',{name:'Find settings',exact:true})).toHaveValue('Center X');await expect(properties.getByRole('button',{name:'Reset setting: Center X',exact:true})).toBeVisible();
  assert.deepEqual(errors,[]);await writeFile('artifacts/settings-tools-ui-results.json',JSON.stringify({date:new Date().toISOString(),checks:['bilingual metadata search','per-view search invariance','modified-only and badges','single and whole resets/undo','hidden parameters and source controls','locks','shared detached properties','dialog focus/close','RU/EN','900x650 and1920x1080'],errors},null,2));console.log('Settings search, changed markers, individual/full reset and compact UI passed');
}finally{if(app){for(const [i,p]of app.windows().entries())await p.screenshot({path:`artifacts/screenshots/settings-tools-last-${i}.png`}).catch(()=>{});await app.evaluate(({app})=>app.exit(0)).catch(()=>{});await app.close().catch(()=>{});}}
