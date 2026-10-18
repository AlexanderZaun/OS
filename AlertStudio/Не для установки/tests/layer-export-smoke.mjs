import {_electron as electron,expect} from '@playwright/test';
import {build} from 'esbuild';
import assert from 'node:assert/strict';
import {mkdir,readFile,access} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
import {menuCommand,appCommand} from './menu-helpers.mjs';
import {resizeWindow,isolateDesktopPointer} from './window-helpers.mjs';
const data=path.resolve(`.test-data/layer-export-${randomUUID()}`);await mkdir(data,{recursive:true});await mkdir('artifacts/screenshots',{recursive:true});
const env={...process.env,ALERT_STUDIO_DATA:data};delete env.ELECTRON_RUN_AS_NODE;
await build({entryPoints:['tests/layer-render-harness.ts'],outfile:'artifacts/layer-render-harness.js',bundle:true,format:'iife',globalName:'layerHarness'});
let app;const errors=[];
try{
  app=await electron.launch({args:['.'],env});const page=await app.firstWindow();page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(e.message));await isolateDesktopPointer(app,page);
  await page.getByRole('button',{name:'Создать проект →'}).click();await page.getByRole('button',{name:'Текст +',exact:true}).click();
  assert.equal(await page.evaluate((await readFile('artifacts/layer-render-harness.js','utf8'))+';layerHarness.run()'),'Layer pixel checks passed');
  const state=()=>page.evaluate(()=>window.studio.snapshot());const baseline=await state();const id=baseline.selected;
  await page.locator('.layer-properties > summary').click();await page.getByLabel('Режим смешивания',{exact:true}).selectOption('screen');
  await expect.poll(async()=>(await state()).project.objects[0].layer?.blend).toBe('screen');
  const opacity=page.getByLabel('Непрозрачность слоя',{exact:true});await opacity.fill('50');await opacity.press('Enter');
  await expect.poll(async()=>(await state()).project.objects[0].layer?.opacity).toBe(50);
  await menuCommand(page,'edit','Отменить');await expect(opacity).toHaveValue('100');await menuCommand(page,'edit','Повторить');await expect(opacity).toHaveValue('50');
  await opacity.fill('101');await opacity.press('Enter');await expect(opacity).toHaveAttribute('aria-invalid','true');assert.equal((await state()).project.objects[0].layer.opacity,50);
  await opacity.fill('20');await opacity.press('Escape');await expect(opacity).toHaveValue('50');
  await assert.rejects(page.evaluate(()=>window.studio.savePng(new Uint8Array([1,2,3]),'ru')));
  const pixels=()=>page.locator('.canvas-stage canvas').evaluate(c=>c.toDataURL());
  async function assertSameFrame(actual,expected){
    const result=await page.evaluate(async([actual,expected])=>{
      async function decode(url){const img=new Image();img.src=url;await img.decode();const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const ctx=c.getContext('2d');ctx.drawImage(img,0,0);return ctx.getImageData(0,0,c.width,c.height).data;}
      const a=await decode(actual),b=await decode(expected);let differences=0,max=0;for(let i=0;i<a.length;i++){const delta=Math.abs(a[i]-b[i]);if(delta){differences++;max=Math.max(max,delta);}}return {differences,max};
    },[actual,expected]);assert.deepEqual(result,{differences:0,max:0});
  }
  await expect.poll(async()=>page.locator('.canvas-stage canvas').evaluate(c=>{const a=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let max=0;for(let i=3;i<a.length;i+=4)max=Math.max(max,a[i]);return max;})).toBe(128);
  const png=path.join(data,'current.png');
  await app.evaluate(({dialog},file)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:file});},png);
  const beforeExport=await state(),beforePixels=await pixels();await menuCommand(page,'file','Экспорт кадра в PNG…');await expect(page.locator('footer')).toContainText('PNG сохранён');
  const bytes=await readFile(png);assert.equal(bytes.readUInt32BE(16),1920);assert.equal(bytes.readUInt32BE(20),1080);await assertSameFrame(`data:image/png;base64,${bytes.toString('base64')}`,beforePixels);assert.deepEqual(await state(),beforeExport);
  // Native dialog cancel does not write or alter project/history.
  const canceled=path.join(data,'canceled.png');await app.evaluate(({dialog},file)=>{dialog.showSaveDialog=async()=>({canceled:true,filePath:file});},canceled);
  await menuCommand(page,'file','Экспорт кадра в PNG…');await expect(page.locator('#menu-trigger-file')).toBeEnabled();await assert.rejects(access(canceled));assert.deepEqual(await state(),beforeExport);
  // Capture the selected notification stage, including its group fade.
  await page.getByRole('group',{name:'Рабочие области уведомления',exact:true}).getByRole('button',{name:'Появление',exact:true}).click();
  await page.getByLabel('Время (секунды)',{exact:true}).fill('0.5');
  await expect.poll(async()=>page.locator('.canvas-stage canvas').evaluate(c=>{const a=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let max=0;for(let i=3;i<a.length;i+=4)max=Math.max(max,a[i]);return max;})).toBe(64);
  await app.evaluate(({dialog},file)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:file});},png);
  const faded=await pixels();await menuCommand(page,'file','Экспорт кадра в PNG…');await expect(page.locator('footer')).toContainText('PNG сохранён');await assertSameFrame(`data:image/png;base64,${(await readFile(png)).toString('base64')}`,faded);
  // Write errors are visible and never claim success.
  await app.evaluate(({dialog},file)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:file});},path.join(data,'missing','fail.png'));
  await menuCommand(page,'file','Экспорт кадра в PNG…');await expect(page.locator('footer')).toContainText('ENOENT');
  assert.deepEqual((await state()).project.objects[0].settings,baseline.project.objects[0].settings);
  // Source selector stays first for linked effects.
  await page.getByRole('button',{name:'Мелкие звёзды +',exact:true}).click();await expect(page.locator('.properties-links').first()).toBeVisible();
  assert.equal(await page.locator('.properties-panel select').first().getAttribute('aria-label'),'Источник тумана');
  await page.evaluate(id=>window.studio.command({type:'select',id}),id);await page.locator('.layer-properties > summary').click();
  // Clear intentional error and missing-source notices before visual review.
  await page.evaluate(async id=>{const s=await window.studio.snapshot();await window.studio.command({type:'remove',id:s.project.objects.find(o=>o.id!==id).id});},id);
  await app.evaluate(({dialog},file)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:file});},png);await menuCommand(page,'file','Экспорт кадра в PNG…');await expect(page.locator('footer')).toContainText('PNG сохранён');
  for(const [width,height] of [[900,650],[1920,1080]]){await resizeWindow(app,page,width,height);await page.screenshot({path:`artifacts/screenshots/layer-style-${width}.png`});assert.equal(await page.locator('.properties-panel').evaluate(e=>e.scrollWidth<=e.clientWidth+1),true);}
  await appCommand(page,'RU');await expect(page.locator('.layer-properties > summary')).toHaveText('Layer appearance');await expect(page.getByLabel('Blend mode',{exact:true})).toHaveValue('screen');
  assert.deepEqual(errors,[]);console.log('Layer appearance, pixel composition, PNG export/cancel/error, RU/EN and compact layout passed');
}finally{if(app){for(const [i,p]of app.windows().entries())await p.screenshot({path:`artifacts/screenshots/layer-export-last-${i}.png`}).catch(()=>{});await app.evaluate(({app})=>app.exit(0)).catch(()=>{});await app.close().catch(()=>{});}}
