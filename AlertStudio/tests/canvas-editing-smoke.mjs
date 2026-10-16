import {_electron as electron,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
import {resizeWindow,waitForCanvasFit,waitForCanvasScale,waitForCanvasLayout} from './window-helpers.mjs';
const data=path.resolve(`.test-data/editing-${randomUUID()}`);await mkdir(data,{recursive:true});await mkdir('artifacts/screenshots',{recursive:true});
const env={...process.env,ALERT_STUDIO_DATA:data};delete env.ELECTRON_RUN_AS_NODE;
const errors=[];let app;
try{
  app=await electron.launch({args:['.'],env});const page=await app.firstWindow();page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));
  await page.getByRole('button',{name:'Создать проект →'}).click();await page.getByRole('button',{name:'Звёзды +',exact:true}).click();
  for(const [label,value] of [['Центр X','500'],['Центр Y','400'],['Ширина поля','400'],['Высота поля','300'],['Поворот поля','30']])await page.getByLabel(label,{exact:true}).fill(value);
  const state=()=>page.evaluate(()=>window.studio.snapshot());
  await page.waitForFunction(async()=>(await window.studio.snapshot()).project.objects[0]?.settings.rotation===30);
  const starId=(await state()).selected;
  await page.getByRole('button',{name:'Текст +',exact:true}).click();await page.getByLabel('Текст',{exact:true}).fill('SELECT ME');
  await page.getByLabel('Положение X',{exact:true}).fill('1000');await page.getByLabel('Положение Y',{exact:true}).fill('600');
  const textId=(await state()).selected;
  const viewport=page.getByRole('region',{name:'Область холста'}),canvas=viewport.locator('canvas'),zoom=page.getByRole('combobox',{name:'Масштаб холста'});
  async function point(x,y){await waitForCanvasLayout(page);const rect=await canvas.boundingBox();return {x:rect.x+x*rect.width/1920,y:rect.y+y*rect.height/1080};}
  async function clickScene(x,y){const p=await point(x,y);await page.mouse.click(p.x,p.y);}
  await clickScene(50,50);await expect.poll(async()=>(await state()).selected).toBe(null);
  await clickScene(500,400);await expect.poll(async()=>(await state()).selected).toBe(starId);
  await zoom.selectOption('0.5');await waitForCanvasScale(canvas,.5);
  let before=await state(),p=await point(500,400);
  await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(p.x+90,p.y+45,{steps:8});
  assert.deepEqual(await state(),before); // Drag is preview-only until release.
  await page.mouse.up();await expect.poll(async()=>(await state()).project.objects[0].settings.x).toBe(680);
  let moved=await state();assert.equal(moved.project.objects[0].settings.y,490);assert.equal(moved.revision,before.revision+1);
  await page.getByRole('button',{name:'Отменить',exact:true}).click();await expect.poll(async()=>(await state()).project.objects[0].settings.x).toBe(500);assert.equal((await state()).project.objects[0].settings.y,400);
  await page.getByRole('button',{name:'Повторить',exact:true}).click();await expect.poll(async()=>(await state()).project.objects[0].settings.x).toBe(680);
  before=await state();p=await point(680,490);await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(p.x+35,p.y+25,{steps:4});await page.keyboard.press('Escape');await page.mouse.up();assert.deepEqual(await state(),before);
  // Authoritative edits arriving during a drag cancel local preview instead of overwriting them.
  p=await point(680,490);await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(p.x+40,p.y+30,{steps:4});
  await page.evaluate(id=>window.studio.command({type:'set',id,key:'x',value:700}),starId);
  await page.waitForFunction(async()=>(await window.studio.snapshot()).project.objects[0].settings.x===700);await page.mouse.up();assert.equal((await state()).project.objects[0].settings.x,700);
  before=await state();p=await point(700,490);await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(p.x+25,p.y+20,{steps:4});
  await resizeWindow(app,page,1000,720);await page.mouse.up();assert.deepEqual(await state(),before);
  await resizeWindow(app,page,1440,940);await waitForCanvasScale(canvas,.5);
  await clickScene(1000,600);await expect.poll(async()=>(await state()).selected).toBe(textId);
  await zoom.selectOption('2');await waitForCanvasScale(canvas,2);
  const childPromise=app.waitForEvent('window');await page.getByRole('button',{name:'Свойства ↗'}).click();const child=await childPromise;
  await child.getByLabel('Положение X',{exact:true}).waitFor();
  p=await point(1000,600);before=await state();await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(p.x+20,p.y+30,{steps:5});await page.mouse.up();
  await expect.poll(async()=>(await state()).project.objects[1].settings.x).toBe(1010);assert.equal((await state()).project.objects[1].settings.y,615);
  await expect(child.getByLabel('Положение X',{exact:true})).toHaveValue('1010');await child.close();
  await zoom.selectOption('fit');
  await resizeWindow(app,page,1920,1080);await waitForCanvasFit(page);await page.screenshot({path:'artifacts/screenshots/editing-1080.png'});
  await resizeWindow(app,page,900,650);await waitForCanvasFit(page);await page.screenshot({path:'artifacts/screenshots/editing-compact.png'});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
  await writeFile('artifacts/editing-ui-results.json',JSON.stringify({date:new Date().toISOString(),tests:['empty click deselect','rotated field hit testing','preview does not mutate project','drag at 50%','one undo/redo per gesture','Escape cancels','concurrent edit cancels','resize during drag cancels','text drag at 200%','detached properties sync','selection frame and compact UI'],errors},null,2));
  console.log('Canvas editing Electron smoke passed');
}finally{if(app){await app.evaluate(({app})=>app.exit(0)).catch(()=>{});await app.close().catch(()=>{});}}
