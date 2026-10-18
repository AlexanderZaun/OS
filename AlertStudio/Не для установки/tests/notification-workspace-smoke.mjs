import {_electron as electron,expect} from '@playwright/test';
import {build} from 'esbuild';
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {randomUUID,createHash} from 'node:crypto';
import path from 'node:path';
import {menuCommand} from './menu-helpers.mjs';
import {resizeWindow,waitForCanvasFit,isolateDesktopPointer} from './window-helpers.mjs';
const data=path.resolve(`.test-data/notification-${randomUUID()}`);await mkdir(data,{recursive:true});await mkdir('artifacts/screenshots',{recursive:true});
const env={...process.env,ALERT_STUDIO_DATA:data};delete env.ELECTRON_RUN_AS_NODE;
await build({entryPoints:['tests/notification-render-harness.ts'],outfile:'artifacts/notification-render-harness.js',bundle:true,format:'iife',globalName:'notificationHarness'});
const errors=[];let app;
try{
  app=await electron.launch({args:['.'],env});const page=await app.firstWindow();page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(e.message));await isolateDesktopPointer(app,page);
  await page.getByRole('button',{name:'Создать проект →'}).click();await page.getByRole('button',{name:'Текст +',exact:true}).click();
  const state=()=>page.evaluate(()=>window.studio.snapshot()),clock=()=>page.evaluate(()=>window.studio.playback());
  const workspace=label=>page.getByRole('group',{name:'Рабочие области уведомления',exact:true}).getByRole('button',{name:label,exact:true});
  const readPixels=()=>page.locator('canvas').evaluate(c=>c.toDataURL());
  async function maxAlpha(){return page.locator('canvas').evaluate(c=>{const a=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let max=0;for(let i=3;i<a.length;i+=4)max=Math.max(max,a[i]);return max;});}
  async function seek(time){await page.getByLabel('Время (секунды)',{exact:true}).fill(String(time));await expect.poll(async()=>(await clock()).time).toBe(time);}
  const baseline=await state();await expect(workspace('Основной эффект')).toHaveAttribute('aria-pressed','true');
  await workspace('Появление').click();await expect.poll(maxAlpha).toBe(0);assert.deepEqual(await state(),baseline);
  await seek(.5);await expect.poll(maxAlpha).toBe(128);
  const initialPixels=await readPixels();await writeFile('artifacts/notification-half-first.png',Buffer.from(initialPixels.split(',')[1],'base64'));
  const half=createHash('sha256').update(Buffer.from(initialPixels)).digest('hex');await seek(1);await expect.poll(maxAlpha).toBe(255);await seek(.5);await expect.poll(maxAlpha).toBe(128);
  const secondPixels=await readPixels();await writeFile('artifacts/notification-half-second.png',Buffer.from(secondPixels.split(',')[1],'base64'));
  await expect.poll(async()=>createHash('sha256').update(Buffer.from(await readPixels())).digest('hex')).toBe(half);
  const duration=page.getByLabel('Длительность появления',{exact:true});await duration.fill('2');await duration.press('Enter');
  await expect.poll(async()=>(await state()).project.notification?.introDuration).toBe(2);await expect.poll(async()=>(await clock()).duration).toBe(2);
  await menuCommand(page,'edit','Отменить');await expect.poll(async()=>(await state()).project.notification).toBe(undefined);await menuCommand(page,'edit','Повторить');
  await expect(duration).toHaveValue('2');
  await duration.fill('0');await duration.press('Enter');await expect(duration).toHaveAttribute('aria-invalid','true');assert.equal((await state()).project.notification.introDuration,2);
  await duration.fill('3');await duration.press('Escape');await expect(duration).toHaveValue('2');
  await seek(0);await page.getByLabel('Плавное появление',{exact:true}).uncheck();await expect.poll(maxAlpha).toBe(255);
  await page.getByLabel('Плавное появление',{exact:true}).check();await expect.poll(maxAlpha).toBe(0);
  await workspace('Сборка').click();await expect(page.getByLabel('Последовательность уведомления',{exact:true})).toContainText('2–7 s');
  await seek(2);await expect(page.getByTestId('stage-readout')).toContainText('Основной эффект');await expect.poll(maxAlpha).toBe(255);
  await seek(7.5);await expect.poll(maxAlpha).toBe(128);await expect(page.getByTestId('stage-readout')).toContainText('Затухание');
  await workspace('Затухание').click();await seek(.5);await expect.poll(maxAlpha).toBe(128);
  // A detached canvas uses the same workspace, clock and project, and can edit durations.
  const childPromise=app.waitForEvent('window');await menuCommand(page,'window','Холст ↗');const child=await childPromise;child.on('pageerror',e=>errors.push(e.message));
  await expect(child.locator('.notification-workspace')).toHaveAttribute('data-workspace','outro');await expect.poll(()=>child.evaluate(()=>window.studio.playback())).toEqual(await clock());
  const childDuration=child.getByLabel('Длительность затухания',{exact:true});await childDuration.fill('2');await childDuration.press('Enter');
  await expect(page.getByLabel('Длительность затухания',{exact:true})).toHaveValue('2');await expect.poll(async()=>(await clock()).duration).toBe(2);await child.close();
  await workspace('Сборка').click();
  await page.getByRole('button',{name:'Настройки стадий',exact:true}).click();
  for(const label of ['Длительность появления','Длительность основного показа','Длительность затухания']){const input=page.getByLabel(label,{exact:true});await input.fill('0.3');await input.press('Enter');await expect(input).toHaveValue('0.3');}
  await expect.poll(async()=>(await clock()).duration).toBe(.9);
  await page.getByRole('button',{name:'Воспроизвести',exact:true}).click();await expect.poll(async()=>(await clock()).playing).toBe(false);await expect.poll(maxAlpha).toBe(0);await expect(page.getByTestId('stage-readout')).toContainText('Завершено');
  await page.getByRole('button',{name:'Воспроизвести',exact:true}).click();await expect.poll(async()=>(await clock()).playing).toBe(true);await page.getByRole('button',{name:'Пауза',exact:true}).click();
  const expected=(await state()).project,folder=path.join(data,'project');await mkdir(folder);await app.evaluate(({dialog},folder)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[folder]});},folder);
  await menuCommand(page,'file','Сохранить');await expect.poll(async()=>(await state()).dirty).toBe(false);
  const saved=await state();await workspace('Основной эффект').click();assert.deepEqual(await state(),saved);await expect(page.getByLabel('Длительность повтора',{exact:true})).toHaveValue('48');
  await menuCommand(page,'file','Открыть');await expect.poll(async()=>(await state()).selected).toBe(null);assert.deepEqual((await state()).project,expected);assert.equal((await clock()).workspace,'main');
  const rendering=await page.evaluate((await readFile('artifacts/notification-render-harness.js','utf8'))+';notificationHarness.run()');
  for(const [width,height,label] of [[1920,1080,'1080'],[900,650,'compact']]){
    await resizeWindow(app,page,width,height);await waitForCanvasFit(page);
    await page.screenshot({path:`artifacts/screenshots/notification-main-${label}.png`});await workspace('Появление').click();await seek(.15);await waitForCanvasFit(page);await page.screenshot({path:`artifacts/screenshots/notification-intro-${label}.png`});
    await workspace('Сборка').click();await seek(.4);await waitForCanvasFit(page);await page.screenshot({path:`artifacts/screenshots/notification-assembly-${label}.png`});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await workspace('Основной эффект').click();
  }
  await page.locator('#menu-trigger-edit').click();await page.getByRole('menuitemcheckbox',{name:'English',exact:true}).click();await expect(page.getByRole('button',{name:'Assembly',exact:true})).toBeVisible();await page.getByRole('button',{name:'Appearance',exact:true}).click();await expect(page.getByLabel('Appearance duration',{exact:true})).toHaveValue('0.3');
  await menuCommand(page,'file','New project');await page.getByRole('button',{name:'Create project →'}).click();await expect.poll(async()=>(await state()).project.objects.length).toBe(0);assert.equal((await state()).project.notification,undefined);assert.equal((await clock()).workspace,'main');
  assert.deepEqual(errors,[]);await writeFile('artifacts/notification-workspace-ui-results.json',JSON.stringify({date:new Date().toISOString(),tests:['four shared workspaces','stage opacity pixels and repeatable seeking','duration validation, undo and redo','fade toggles','assembly boundaries and automatic stop/replay','detached canvas synchronization','multi-file save/open and new project reset','group opacity with overlapping primitives','RU/EN','900x650 and 1920x1080'],rendering,errors},null,2));
  console.log('Notification workspaces Electron smoke passed',rendering);
}finally{if(app){for(const [i,p]of app.windows().entries())await p.screenshot({path:`artifacts/screenshots/notification-last-${i}.png`}).catch(()=>{});await app.evaluate(({app})=>app.exit(0)).catch(()=>{});await app.close().catch(()=>{});}}
