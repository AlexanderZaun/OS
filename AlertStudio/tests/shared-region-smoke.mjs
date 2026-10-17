import {appCommand,ensurePanelManager} from './menu-helpers.mjs';
import {_electron as electron,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
import {resizeWindow,waitForCanvasFit,waitForCanvasScale,waitForCanvasLayout,isolateDesktopPointer} from './window-helpers.mjs';
const data=path.resolve(`.test-data/region-${randomUUID()}`);await mkdir(data,{recursive:true});await mkdir('artifacts/screenshots',{recursive:true});
const env={...process.env,ALERT_STUDIO_DATA:data};delete env.ELECTRON_RUN_AS_NODE;
const errors=[];let app;
try{
  app=await electron.launch({args:['.'],env});const page=await app.firstWindow();page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));
  await isolateDesktopPointer(app,page);
  await app.evaluate(({dialog})=>{dialog.showMessageBox=async()=>({response:1,checkboxChecked:false});});
  await page.getByRole('button',{name:'Создать проект →'}).click();await ensurePanelManager(page);await appCommand(page,'Сцена-пример');
  const state=()=>page.evaluate(()=>window.studio.snapshot());await page.waitForFunction(async()=>(await window.studio.snapshot()).project.objects.length===7);
  const project=(await state()).project,[master,follower]=project.objects;
  await page.getByRole('button',{name:/^Туман 2/}).click();
  await expect(page.getByLabel('Режим области',{exact:true})).toHaveValue('source');await expect(page.getByLabel('Источник области',{exact:true})).toHaveValue(master.id);
  await expect(page.getByLabel('Центр X',{exact:true})).toHaveCount(0);await expect(page.getByLabel('Смещение области X',{exact:true})).toHaveValue('0');
  // Keep just the layer being dragged visible; hidden dependencies remain available.
  async function onlyVisible(id){await page.evaluate(async(id)=>{const state=await window.studio.snapshot();for(const object of state.project.objects)if(object.visible!==(object.id===id))await window.studio.command({type:'visibility',id:object.id});},id);
    for(const object of project.objects){const checkbox=page.getByRole('checkbox',{name:`Видимость ${object.name}`,exact:true});if(object.id===id)await expect(checkbox).toBeChecked();else await expect(checkbox).not.toBeChecked();}
  }
  await onlyVisible(follower.id);await resizeWindow(app,page,1440,940);
  const viewport=page.getByRole('region',{name:'Область холста'}),canvas=viewport.locator('canvas');
  await page.getByRole('combobox',{name:'Масштаб холста',exact:true}).selectOption('0.5');await waitForCanvasScale(canvas,.5);
  async function point(x,y){await waitForCanvasLayout(page);const rect=await canvas.boundingBox();return {x:rect.x+x*rect.width/1920,y:rect.y+y*rect.height/1080};}
  let before=await state(),p=await point(960,540);await page.mouse.move(p.x,p.y);await page.mouse.down();await expect(viewport).toHaveAttribute('data-navigation','moving');await page.mouse.move(p.x+40,p.y+20,{steps:8});assert.deepEqual(await state(),before);
  await page.mouse.up();await expect.poll(async()=>(await state()).project.objects[1].settings.regionOffsetX).toBe(80);
  assert.equal((await state()).project.objects[1].settings.regionOffsetY,40);assert.equal((await state()).project.objects[1].settings.x,960);assert.equal((await state()).revision,before.revision+1);
  p=await point(1040,580);let selection=await page.locator('.canvas-selection').boundingBox();assert.ok(Math.abs(selection.x+selection.width/2-p.x)<1);assert.ok(Math.abs(selection.y+selection.height/2-p.y)<1);
  await appCommand(page,'Отменить');await expect(page.getByLabel('Смещение области X',{exact:true})).toHaveValue('0');
  await appCommand(page,'Повторить');await expect(page.getByLabel('Смещение области X',{exact:true})).toHaveValue('80');
  // A release may contain a newer position than the last delivered move sample.
  await viewport.evaluate(el=>el.addEventListener('pointerdown',e=>el.dataset.testPointerId=String(e.pointerId),{once:true}));
  p=await point(1040,580);before=await state();await page.mouse.move(p.x,p.y);await page.mouse.down();
  await viewport.dispatchEvent('pointerup',{pointerId:Number(await viewport.getAttribute('data-test-pointer-id')),pointerType:'mouse',button:0,clientX:p.x+10,clientY:p.y+5});await page.mouse.up();
  await expect.poll(async()=>(await state()).project.objects[1].settings.regionOffsetX).toBe(100);assert.equal((await state()).project.objects[1].settings.regionOffsetY,50);assert.equal((await state()).revision,before.revision+1);
  await appCommand(page,'Отменить');await expect(page.getByLabel('Смещение области X',{exact:true})).toHaveValue('80');
  await onlyVisible(master.id);before=await state();p=await point(960,540);await page.mouse.move(p.x,p.y);await page.mouse.down();await expect(viewport).toHaveAttribute('data-navigation','moving');await page.mouse.move(p.x+60,p.y+30,{steps:8});await page.mouse.up();
  await expect.poll(async()=>(await state()).project.objects[0].settings.x).toBe(1080);assert.equal((await state()).project.objects[0].settings.y,600);assert.equal((await state()).revision,before.revision+1);
  await page.evaluate(async()=>{for(const object of (await window.studio.snapshot()).project.objects)if(!object.visible)await window.studio.command({type:'visibility',id:object.id});});
  await page.getByRole('button',{name:/^Туман 2/}).click();await expect(page.getByLabel('Смещение области X',{exact:true})).toHaveValue('80');
  p=await point(1160,640);selection=await page.locator('.canvas-selection').boundingBox();assert.ok(Math.abs(selection.x+selection.width/2-p.x)<1);assert.ok(Math.abs(selection.y+selection.height/2-p.y)<1);
  await page.getByLabel('Масштаб области',{exact:true}).fill('120');await page.getByLabel('Поворот области',{exact:true}).fill('15');
  await page.getByLabel('Режим области',{exact:true}).selectOption('independent');await expect(page.getByLabel('Центр X',{exact:true})).toHaveValue('960');await expect(page.getByLabel('Ширина тумана',{exact:true})).toHaveValue('900');
  await page.getByLabel('Режим области',{exact:true}).selectOption('source');await expect(page.getByLabel('Источник области',{exact:true})).toHaveValue(master.id);await expect(page.getByLabel('Масштаб области',{exact:true})).toHaveValue('120');
  await page.getByLabel('Источник области',{exact:true}).selectOption('');await expect(page.locator('.canvas-diagnostics')).toContainText('Проверьте связи');
  await page.getByLabel('Источник области',{exact:true}).selectOption(master.id);await expect(page.locator('.canvas-diagnostics')).toHaveCount(0);
  const beforeCycle=(await state()).project;assert.equal(await page.evaluate(async({master,follower})=>{try{await window.studio.command({type:'set',id:master,key:'regionSource',value:follower});return false;}catch{return true;}},{master:master.id,follower:follower.id}),true);assert.deepEqual((await state()).project,beforeCycle);
  await page.getByRole('button',{name:/^Туман 1/}).click();await page.getByRole('button',{name:'Удалить',exact:true}).click();await expect(page.locator('.canvas-diagnostics')).toContainText('Проверьте связи');
  await appCommand(page,'Отменить');await expect(page.locator('.canvas-diagnostics')).toHaveCount(0);
  await page.getByRole('button',{name:/^Туман 2/}).click();await resizeWindow(app,page,1920,1080);await page.getByRole('combobox',{name:'Масштаб холста',exact:true}).selectOption('fit');await waitForCanvasFit(page);await page.screenshot({path:'artifacts/screenshots/shared-region-1080.png'});
  await resizeWindow(app,page,900,650);await waitForCanvasFit(page);await page.screenshot({path:'artifacts/screenshots/shared-region-compact.png'});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  const expected=(await state()).project,folder=path.join(data,'Project');await mkdir(folder);await app.evaluate(({dialog},folder)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[folder]});},folder);
  await appCommand(page,'Сохранить');await page.waitForFunction(async()=>!(await window.studio.snapshot()).dirty);
  await appCommand(page,'Открыть');await page.waitForFunction(async()=>!(await window.studio.snapshot()).selected);assert.deepEqual((await state()).project,expected);
  await appCommand(page,'RU');await page.getByRole('button',{name:/^Туман 2/}).click();await expect(page.getByLabel('Region source',{exact:true})).toHaveValue(master.id);await expect(page.getByLabel('Region offset X',{exact:true})).toHaveValue('80');
  assert.deepEqual(errors,[]);await writeFile('artifacts/shared-region-ui-results.json',JSON.stringify({date:new Date().toISOString(),checks:['preset fog links','conditional RU/EN properties','linked fog drag edits offsets; preview and single undo/redo','master drag updates inherited selection','independent mode keeps saved region values','missing source and deletion/undo diagnostics','cycle rejected without mutation','linked folder save/open','compact and Full HD'],errors},null,2));console.log('Shared fog region Electron smoke passed');
}finally{if(app){await app.evaluate(({app})=>app.exit(0)).catch(()=>{});await app.close().catch(()=>{});}}
