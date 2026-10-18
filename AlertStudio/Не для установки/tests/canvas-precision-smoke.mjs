import {appCommand,ensurePanelManager} from './menu-helpers.mjs';
import {_electron as electron,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
import {resizeWindow,waitForCanvasLayout,waitForCanvasFit,waitForCanvasScale,isolateDesktopPointer} from './window-helpers.mjs';
const data=path.resolve(`.test-data/precision-${randomUUID()}`);await mkdir(data,{recursive:true});await mkdir('artifacts/screenshots',{recursive:true});
const env={...process.env,ALERT_STUDIO_DATA:data};delete env.ELECTRON_RUN_AS_NODE;
let app;const errors=[];
try{
  app=await electron.launch({args:['.'],env});const page=await app.firstWindow();page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));
  await isolateDesktopPointer(app,page);
  await page.getByRole('button',{name:'Создать проект →'}).click();await ensurePanelManager(page);await page.getByRole('button',{name:'Туман +',exact:true}).click();
  for(const [label,value] of [['Центр X','480'],['Центр Y','680'],['Ширина тумана','400'],['Высота тумана','200'],['Поворот','35']])await page.getByLabel(label,{exact:true}).fill(value);
  await expect(page.getByLabel('Поворот',{exact:true})).toHaveValue('35');await resizeWindow(app,page,1920,1080);
  const viewport=page.getByRole('region',{name:'Область холста',exact:true}),canvas=viewport.locator('canvas'),zoom=page.getByRole('combobox',{name:'Масштаб холста',exact:true}),entry=page.getByLabel('Масштаб в процентах',{exact:true});
  const state=()=>page.evaluate(()=>window.studio.snapshot()),before=await state(),rect=()=>canvas.boundingBox();
  await entry.fill('123,5');await entry.press('Enter');await waitForCanvasScale(canvas,1.235);await expect(entry).toHaveValue('123.5');
  await entry.fill('bad');await entry.press('Enter');await expect(entry).toHaveValue('123.5');await waitForCanvasScale(canvas,1.235);
  await entry.fill('900');await entry.press('Enter');await waitForCanvasScale(canvas,8);await expect(page.getByRole('button',{name:'Приблизить',exact:true})).toBeDisabled();
  await entry.fill('0.1');await entry.press('Enter');await waitForCanvasScale(canvas,.01);await expect(page.getByRole('button',{name:'Отдалить',exact:true})).toBeDisabled();
  await page.getByRole('button',{name:'Вписать',exact:true}).click();await waitForCanvasFit(page);await entry.fill('300');await entry.press('Escape');await zoom.focus();await expect(zoom).toHaveValue('fit');
  async function assertSelectedFits(){await waitForCanvasLayout(page);const selection=await page.locator('.canvas-selection').boundingBox(),v=await viewport.boundingBox();assert.ok(selection.x>=v.x+22&&selection.y>=v.y+22&&selection.x+selection.width<=v.x+v.width-22&&selection.y+selection.height<=v.y+v.height-22);assert.ok(Math.abs(selection.x+selection.width/2-v.x-v.width/2)<1);assert.ok(Math.abs(selection.y+selection.height/2-v.y-v.height/2)<1);}
  await page.getByRole('button',{name:'Вписать выбранное',exact:true}).click();await assertSelectedFits();await page.screenshot({path:'artifacts/screenshots/canvas-selected-1080.png'});
  await page.getByRole('button',{name:'Вписать',exact:true}).click();await viewport.press('f');await assertSelectedFits();
  await zoom.selectOption('1');await waitForCanvasScale(canvas,1);await viewport.press('ArrowRight');let c=await rect();await viewport.press('Shift+ArrowDown');await expect.poll(async()=>(await rect()).y-c.y).toBe(-160);
  await page.getByRole('button',{name:'Центрировать сцену',exact:true}).click();await waitForCanvasLayout(page);c=await rect();let v=await viewport.boundingBox();assert.ok(Math.abs(c.x+c.width/2-v.x-v.width/2)<1);assert.ok(Math.abs(c.y+c.height/2-v.y-v.height/2)<1);
  await viewport.dispatchEvent('wheel',{deltaY:120,shiftKey:true,deltaMode:0,clientX:v.x+v.width/2,clientY:v.y+v.height/2});await expect.poll(async()=>(await rect()).x-c.x).toBe(-120);
  // Native touch input establishes real pointer capture without relying on the desktop mouse.
  await page.getByRole('button',{name:'Центрировать сцену',exact:true}).click();await zoom.selectOption('0.5');await waitForCanvasScale(canvas,.5);v=await viewport.boundingBox();
  const x=v.x+v.width/2,y=v.y+v.height/2,cdp=await page.context().newCDPSession(page);
  const touch=(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map(([id,px,py])=>({id,x:px,y:py,radiusX:2,radiusY:2,force:1}))});
  await page.evaluate(()=>{window.touchLog=[];for(const type of ['pointerdown','pointermove','pointerup','pointercancel','lostpointercapture'])window.addEventListener(type,e=>{if(e.pointerType==='touch')window.touchLog.push({type,id:e.pointerId,x:e.clientX,y:e.clientY,mode:document.querySelector('.canvas-stage').dataset.navigation});},true);});
  const baseline=await rect();await touch('touchStart',[[1,x-40,y],[2,x+40,y]]);await expect(viewport).toHaveAttribute('data-navigation','dragging');
  await touch('touchMove',[[1,x-60,y+10],[2,x+100,y+10]]);await waitForCanvasScale(canvas,1);c=await rect();assert.ok(Math.abs(c.x+c.width/2-(x+20))<1);assert.ok(Math.abs(c.y+c.height/2-(y+10))<1);
  await touch('touchEnd',[[2,x+100,y+10]]);c=await rect();await touch('touchMove',[[1,x-45,y+30]]);await expect.poll(async()=>(await rect()).x-c.x).toBe(15);assert.ok(Math.abs((await rect()).y-c.y-20)<1);await touch('touchEnd',[]);await expect(viewport).toHaveAttribute('data-navigation','idle');
  await page.getByRole('button',{name:'Рука',exact:true}).click();await expect(page.getByRole('button',{name:'Рука',exact:true})).toHaveAttribute('aria-pressed','true');
  c=await rect();await page.mouse.move(x,y);await page.mouse.down();await expect(viewport).toHaveAttribute('data-navigation','dragging');await page.mouse.move(x+60,y+30,{steps:5});await page.mouse.up();await expect.poll(async()=>(await rect()).x-c.x).toBe(60);
  c=await rect();await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x-35,y-20,{steps:4});await page.keyboard.press('Escape');await page.mouse.up();await expect.poll(async()=>Math.abs((await rect()).x-c.x)).toBeLessThan(1);assert.ok(Math.abs((await rect()).y-c.y)<1);await viewport.press('h');await expect(viewport).toHaveAttribute('data-navigation','idle');
  await cdp.detach();assert.deepEqual(await state(),before);
  await resizeWindow(app,page,900,650);await page.getByRole('button',{name:'Вписать выбранное',exact:true}).click();await assertSelectedFits();await page.screenshot({path:'artifacts/screenshots/canvas-selected-compact.png'});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await appCommand(page,'RU');await expect(page.getByLabel('Zoom percentage',{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Fit selected',exact:true})).toBeVisible();
  assert.deepEqual(errors,[]);await writeFile('artifacts/canvas-precision-ui-results.json',JSON.stringify({date:new Date().toISOString(),checks:['decimal comma/custom percent/invalid/limits/Escape','rotated off-center selection framing/button/F','arrow/shift arrow/centering','shift wheel horizontal pan','native two-touch zoom + moving centroid + one-touch continuation','hand tool mouse pan/H/Escape','unchanged project/history','RU/EN','900x650 and 1920x1080'],touchBaseline:baseline,errors},null,2));console.log('Canvas precision Electron smoke passed');
}catch(error){if(app)console.error(await app.firstWindow().then(p=>p.evaluate(()=>window.touchLog)));throw error;}finally{if(app){for(const [i,p] of app.windows().entries())await p.screenshot({path:`artifacts/screenshots/canvas-precision-last-${i}.png`}).catch(()=>{});await app.evaluate(({app})=>app.exit(0)).catch(()=>{});await app.close().catch(()=>{});}}
