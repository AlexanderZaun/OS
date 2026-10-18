import {_electron as electron,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
import {menuCommand,appCommand} from './menu-helpers.mjs';
import {resizeWindow,isolateDesktopPointer,waitForCanvasFit} from './window-helpers.mjs';
const data=path.resolve(`.test-data/layer-editor-${randomUUID()}`);await mkdir(data,{recursive:true});await mkdir('artifacts/screenshots',{recursive:true});
const env={...process.env,ALERT_STUDIO_DATA:data};delete env.ELECTRON_RUN_AS_NODE;let app;const errors=[];
try{
  app=await electron.launch({args:['.'],env});const page=await app.firstWindow();page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(e.message));await isolateDesktopPointer(app,page);
  await page.getByRole('button',{name:'Создать проект →'}).click();const state=()=>page.evaluate(()=>window.studio.snapshot());
  await page.getByRole('button',{name:'Текст +',exact:true}).click();const a=(await state()).selected;
  await page.evaluate(async id=>{await window.studio.command({type:'rename',id,name:'Left'});await window.studio.command({type:'set',id,key:'x',value:480});},a);
  await page.getByRole('button',{name:'Текст +',exact:true}).click();const b=(await state()).selected;
  await page.evaluate(async id=>{await window.studio.command({type:'rename',id,name:'Right'});await window.studio.command({type:'set',id,key:'x',value:1440});},b);
  const layers=page.locator('.layers-panel'),row=id=>layers.locator(`[data-layer-id="${id}"]`),select=async id=>{await row(id).locator('.layer-select').click();await expect.poll(async()=>(await state()).selected).toBe(id);};
  const lock=()=>layers.getByRole('button',{name:'Блокировка слоя',exact:true}),solo=()=>layers.getByRole('button',{name:'Solo слоя',exact:true});
  await select(a);await lock().click();await expect(lock()).toHaveAttribute('aria-pressed','true');await expect(row(a)).toHaveAttribute('data-locked','true');
  await expect(page.getByLabel('Положение X',{exact:true})).toBeDisabled();await expect(layers.getByRole('button',{name:'Удалить',exact:true})).toBeDisabled();await expect(row(a).locator('.layer-grip')).toBeDisabled();
  await assert.rejects(page.evaluate(id=>window.studio.command({type:'set',id,key:'x',value:100}),a),/layerLocked/);
  await page.locator('#menu-trigger-object').click();await expect(page.getByRole('menuitem',{name:'Переименовать объект',exact:true})).toBeDisabled();await page.keyboard.press('Escape');
  // Locked canvas content cannot be dragged; it remains selectable in the layer list.
  await waitForCanvasFit(page);const canvas=page.locator('.canvas-stage canvas'),box=await canvas.boundingBox(),point={x:box.x+480/1920*box.width,y:box.y+540/1080*box.height};
  await page.mouse.move(point.x,point.y);await page.mouse.down();await page.mouse.move(point.x+45,point.y+15,{steps:5});await page.mouse.up();assert.equal((await state()).project.objects.find(o=>o.id===a).settings.x,480);
  await select(a);await layers.getByLabel('Цветовая метка слоя',{exact:true}).selectOption('purple');await expect(row(a)).toHaveAttribute('data-tag','purple');
  // Both layers may be Solo. Non-Solo drawing is suppressed without touching visible flags.
  await solo().click();await expect(row(a)).toHaveAttribute('data-solo','true');
  async function alphaHalf(right){return canvas.evaluate((c,right)=>{const a=c.getContext('2d').getImageData(right?c.width/2:0,0,c.width/2,c.height).data;let count=0;for(let i=3;i<a.length;i+=4)if(a[i])count++;return count;},right);}
  await expect.poll(()=>alphaHalf(false)).toBeGreaterThan(0);await expect.poll(()=>alphaHalf(true)).toBe(0);assert.ok((await state()).project.objects.every(o=>o.visible));
  const png=path.join(data,'solo.png');await app.evaluate(({dialog},file)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:file});},png);await menuCommand(page,'file','Экспорт кадра в PNG…');await expect(page.locator('footer')).toContainText('PNG сохранён');
  const exported=await app.evaluate(({nativeImage},file)=>{const img=nativeImage.createFromPath(file),size=img.getSize(),pixels=img.toBitmap();let left=0,right=0;for(let y=0;y<size.height;y++)for(let x=0;x<size.width;x++)if(pixels[(y*size.width+x)*4+3]){if(x<size.width/2)left++;else right++;}return {left,right};},png);assert.ok(exported.left>0);assert.equal(exported.right,0);
  await select(b);await solo().click();await expect.poll(()=>alphaHalf(true)).toBeGreaterThan(0);await layers.getByRole('button',{name:'Снять Solo',exact:true}).click();await expect(layers.locator('.layers-solo-banner')).toHaveCount(0);
  await menuCommand(page,'edit','Отменить');await expect(layers.locator('.layers-solo-banner')).toContainText('2');
  await select(a);const childPromise=app.waitForEvent('window');await menuCommand(page,'window','Слои ↗');const child=await childPromise;child.on('pageerror',e=>errors.push(e.message));
  await expect(child.getByRole('button',{name:'Блокировка слоя',exact:true})).toHaveAttribute('aria-pressed','true');await child.getByRole('button',{name:'Блокировка слоя',exact:true}).click();await expect(lock()).toHaveAttribute('aria-pressed','false');await child.close();
  await lock().click();const expected=(await state()).project;
  const folder=path.join(data,'project');await mkdir(folder);await app.evaluate(({dialog},folder)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[folder]});dialog.showMessageBox=async()=>({response:1,checkboxChecked:false});},folder);
  await menuCommand(page,'file','Сохранить');await expect.poll(async()=>(await state()).dirty).toBe(false);await menuCommand(page,'file','Открыть');assert.deepEqual((await state()).project,expected);
  await select(a);await expect(lock()).toHaveAttribute('aria-pressed','true');await expect(layers.getByLabel('Цветовая метка слоя',{exact:true})).toHaveValue('purple');
  for(const [width,height]of [[900,650],[1920,1080]]){await resizeWindow(app,page,width,height);await page.screenshot({path:`artifacts/screenshots/layer-editor-${width}.png`});assert.equal(await layers.evaluate(e=>e.scrollWidth>e.clientWidth),false);const list=await layers.locator('.layers-list').boundingBox();assert.ok(list.height>=50);}
  await appCommand(page,'RU');await expect(layers.getByRole('button',{name:'Lock layer',exact:true})).toHaveAttribute('aria-pressed','true');await expect(layers.getByLabel('Layer color label',{exact:true})).toHaveValue('purple');
  await page.getByRole('button',{name:'Unlock layer',exact:true}).click();await expect(page.getByLabel('Position X',{exact:true})).toBeEnabled();
  assert.deepEqual(errors,[]);await writeFile('artifacts/layer-editor-ui-results.json',JSON.stringify({date:new Date().toISOString(),checks:['lock and disabled actions','core protection','canvas drag protection','multi Solo pixels and clear undo','tags','detached synchronization','save/open','900x650 and1920x1080','RU/EN'],errors},null,2));console.log('Layer lock, multi Solo, color labels, persistence and compact UI passed');
}finally{if(app){for(const [i,p]of app.windows().entries())await p.screenshot({path:`artifacts/screenshots/layer-editor-last-${i}.png`}).catch(()=>{});await app.evaluate(({app})=>app.exit(0)).catch(()=>{});await app.close().catch(()=>{});}}
