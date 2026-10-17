import {_electron as electron,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
import {resizeWindow,waitForCanvasLayout,waitForCanvasFit,isolateDesktopPointer} from './window-helpers.mjs';

const data=path.resolve(`.test-data/navigation-${randomUUID()}`);await mkdir(data,{recursive:true});await mkdir('artifacts/screenshots',{recursive:true});
const env={...process.env,ALERT_STUDIO_DATA:data};delete env.ELECTRON_RUN_AS_NODE;
const errors=[];let app;
try {
  app=await electron.launch({args:['.'],env});
  const page=await app.firstWindow();page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));
  await isolateDesktopPointer(app,page);
  await page.evaluate(()=>{window.navigationEvents=[];for(const type of ['pointerdown','pointermove','pointerup','lostpointercapture','blur','keydown','keyup'])window.addEventListener(type,e=>window.navigationEvents.push({type,key:e.key,hovered:document.querySelector('.canvas-stage:hover')?.className,active:document.activeElement?.outerHTML.slice(0,150),x:e.clientX,y:e.clientY,target:e.target?.className,mode:document.querySelector('.canvas-stage')?.dataset.navigation}),true);});
  await page.getByRole('button',{name:'Создать проект →'}).click();await page.getByRole('button',{name:'Туман +',exact:true}).click();
  await page.getByLabel('Цвет тумана',{exact:true}).waitFor();
  const viewport=page.getByRole('region',{name:'Область холста'}),canvas=viewport.locator('canvas');
  const zoom=page.getByRole('combobox',{name:'Масштаб холста'});
  const before=await page.evaluate(()=>window.studio.snapshot());
  const size=()=>canvas.evaluate(c=>({width:c.width,height:c.height}));
  async function assertFits(){
    await waitForCanvasFit(page);
    await expect(zoom).toHaveValue('fit');
    await expect.poll(async()=>{const c=await canvas.boundingBox(),v=await viewport.boundingBox();return c.x>=v.x+20&&c.y>=v.y+20&&c.x+c.width<=v.x+v.width-20&&c.y+c.height<=v.y+v.height-20;}).toBe(true);
  }
  await assertFits();
  let c=await canvas.boundingBox(),v=await viewport.boundingBox();
  const point={x:v.x+v.width*.63,y:v.y+v.height*.45},anchor={x:(point.x-c.x)/c.width,y:(point.y-c.y)/c.height},fitWidth=c.width;
  await page.mouse.move(point.x,point.y);await page.mouse.wheel(0,-180);
  await expect.poll(async()=>(await canvas.boundingBox()).width).toBeGreaterThan(fitWidth*1.3);
  c=await canvas.boundingBox();assert.ok(Math.abs((point.x-c.x)/c.width-anchor.x)<.002);assert.ok(Math.abs((point.y-c.y)/c.height-anchor.y)<.002);
  await page.mouse.wheel(0,180);await expect.poll(async()=>Math.abs((await canvas.boundingBox()).width-fitWidth)).toBeLessThan(1);
  await page.getByRole('button',{name:'Приблизить',exact:true}).click();await expect.poll(async()=>(await canvas.boundingBox()).width).toBeGreaterThan(fitWidth);
  await page.getByRole('button',{name:'Отдалить',exact:true}).click();await expect.poll(async()=>Math.abs((await canvas.boundingBox()).width-fitWidth)).toBeLessThan(1);
  await zoom.selectOption('1');await expect.poll(async()=>(await canvas.boundingBox()).width).toBe(1920);
  assert.deepEqual(await size(),{width:1920,height:1080});
  await waitForCanvasLayout(page);v=await viewport.boundingBox();const center={x:v.x+v.width/2,y:v.y+v.height/2};
  // Space also works after pressing a toolbar button, without an extra canvas click.
  await page.getByRole('button',{name:'Приблизить',exact:true}).focus();await page.mouse.move(center.x,center.y);
  c=await canvas.boundingBox();await page.keyboard.down('Space');
  await expect(viewport).toHaveAttribute('data-navigation','pan');
  await page.mouse.move(center.x,center.y);await page.mouse.down();await expect(viewport).toHaveAttribute('data-navigation','dragging');await page.mouse.move(center.x+90,center.y+55,{steps:6});
  await expect.poll(async()=>Math.abs((await canvas.boundingBox()).x-c.x-90)).toBeLessThan(1);
  await page.mouse.up();await page.keyboard.up('Space');
  await expect.poll(async()=>Math.abs((await canvas.boundingBox()).x-c.x-90)).toBeLessThan(1);
  assert.ok(Math.abs((await canvas.boundingBox()).y-c.y-55)<1);
  await expect(page.getByRole('button',{name:'Приблизить',exact:true})).toBeEnabled();
  c=await canvas.boundingBox();await page.mouse.move(center.x,center.y);await page.mouse.down({button:'middle'});await page.mouse.move(center.x-40,center.y-25,{steps:5});await page.mouse.up({button:'middle'});
  await expect.poll(async()=>Math.abs((await canvas.boundingBox()).x-c.x+40)).toBeLessThan(1);
  await viewport.press('Home');await assertFits();await viewport.press('1');await expect.poll(async()=>(await canvas.boundingBox()).width).toBe(1920);
  await zoom.selectOption('8');await expect(page.getByRole('button',{name:'Приблизить',exact:true})).toBeDisabled();
  await page.getByRole('button',{name:'Вписать',exact:true}).click();await assertFits();
  const snapshotBeforeTyping=await page.evaluate(()=>window.studio.snapshot());
  await page.getByLabel('Центр X',{exact:true}).focus();await page.keyboard.press('Space');
  assert.equal(await viewport.getAttribute('data-navigation'),'idle');
  assert.deepEqual(await page.evaluate(()=>window.studio.snapshot()),snapshotBeforeTyping);
  await resizeWindow(app,page,900,650);await assertFits();
  await page.screenshot({path:'artifacts/screenshots/navigation-compact.png'});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await resizeWindow(app,page,1920,1080);await assertFits();
  await page.screenshot({path:'artifacts/screenshots/navigation-1080.png'});
  // Each added canvas has its own camera, while both share project data.
  await zoom.selectOption('2');await page.getByRole('button',{name:'Холст +',exact:true}).click();
  const cameras=page.locator('select[aria-label="Масштаб холста"]');
  await expect(cameras).toHaveCount(2);await expect(cameras.nth(0)).toHaveValue('2');await expect(cameras.nth(1)).toHaveValue('fit');
  assert.deepEqual(await page.evaluate(()=>window.studio.snapshot()),before);
  await page.getByRole('button',{name:'RU',exact:true}).click();await expect(page.locator('select[aria-label="Canvas zoom"]').last()).toHaveValue('fit');
  assert.deepEqual(errors,[]);
  await writeFile('artifacts/navigation-ui-results.json',JSON.stringify({date:new Date().toISOString(),tests:['fit and responsive resize','wheel zoom anchored at pointer','zoom buttons','100% without resizing bitmap','Space + drag pan','middle mouse pan','Home and 1 keys','800% limit','900x650 and 1920x1080','independent panel camera','navigation leaves project/history unchanged','RU/EN'],errors},null,2));
  console.log('Canvas navigation Electron smoke passed');
} finally {if(app){const page=app.windows()[0];if(page)await writeFile('artifacts/navigation-events.json',JSON.stringify(await page.evaluate(()=>window.navigationEvents),null,2)).catch(()=>{});await app.evaluate(({app})=>app.exit(0)).catch(()=>{});await app.close().catch(()=>{});}}
