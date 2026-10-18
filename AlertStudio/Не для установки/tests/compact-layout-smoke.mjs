import {_electron as electron,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
import {menuCommand} from './menu-helpers.mjs';
import {resizeWindow,waitForCanvasFit,isolateDesktopPointer} from './window-helpers.mjs';
const data=path.resolve(`.test-data/compact-${randomUUID()}`);await mkdir(data,{recursive:true});await mkdir('artifacts/screenshots',{recursive:true});
const env={...process.env,ALERT_STUDIO_DATA:data};delete env.ELECTRON_RUN_AS_NODE;
const errors=[],measurements=[];let app;
try{
  app=await electron.launch({args:['.'],env});const page=await app.firstWindow();page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(e.message));await isolateDesktopPointer(app,page);
  await menuCommand(page,'file','Сцена-пример');
  await expect(page.locator('.canvas-stage canvas')).toBeVisible();await expect.poll(()=>page.evaluate(async()=>(await window.studio.snapshot()).project.objects.length)).toBe(7);
  const state=()=>page.evaluate(()=>window.studio.snapshot()),before=await state();
  const mode=label=>page.getByRole('group',{name:'Рабочие области уведомления',exact:true}).getByRole('button',{name:label,exact:true});
  for(const [width,height,label]of[[2560,1440,'1440'],[1920,1080,'1080'],[900,650,'compact']]){
    await resizeWindow(app,page,width,height);await mode('Основной эффект').click();await waitForCanvasFit(page);
    const sizes=await page.evaluate(()=>{
      const box=selector=>{const b=document.querySelector(selector).getBoundingClientRect();return {width:b.width,height:b.height};};
      return {viewport:innerWidth,header:box('.topbar'),workspace:box('.notification-workspace'),toolbar:box('.canvas-tools'),canvas:box('.canvas-stage'),caption:box('.canvas-caption'),footer:box('footer')};
    });
    assert.ok(sizes.header.height<=40,'Brand and application menus share one compact row');
    assert.ok(sizes.workspace.height<=48,'Main workspace settings share a row');
    assert.ok(sizes.caption.height<=29&&sizes.footer.height<=27,'Status areas do not consume extra rows');
    if(width>=1920)assert.ok(sizes.toolbar.height<=42,'Wide canvas tools use one row');
    assert.ok(sizes.canvas.height>height*.5,'Most vertical space remains available to the canvas');
    measurements.push({label,...sizes});
    await page.screenshot({path:`artifacts/screenshots/compact-main-${label}.png`});
    await mode('Появление').click();await page.getByLabel('Время (секунды)',{exact:true}).fill('0.5');await waitForCanvasFit(page);
    assert.ok((await page.locator('.notification-workspace').boundingBox()).height<=48);
    await mode('Сборка').click();await page.getByLabel('Время (секунды)',{exact:true}).fill('2');await waitForCanvasFit(page);
    assert.ok((await page.locator('.stage-sequence').boundingBox()).width<750,'Sequence content does not stretch across the display');
    await page.screenshot({path:`artifacts/screenshots/compact-assembly-${label}.png`});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    assert.deepEqual(await state(),before);
  }
  // Drag the actual Dockview splitter to the new minimum catalog width.
  const catalog=page.locator('.object-catalog-panel'),box=await catalog.boundingBox();
  await page.mouse.move(box.x+box.width+1,box.y+60);await page.mouse.down();await page.mouse.move(box.x+30,box.y+60,{steps:20});await page.mouse.up();
  await expect.poll(async()=>(await catalog.boundingBox()).width).toBeLessThanOrEqual(125);
  await expect(page.getByRole('button',{name:'Крупные звёзды +',exact:true})).toBeVisible();
  const geometry=await catalog.locator('.catalog-item-line').evaluateAll(items=>items.map(item=>({height:item.getBoundingClientRect().height,overflow:item.scrollWidth>item.clientWidth})));
  assert.ok(geometry.every(item=>item.height<=18&&!item.overflow),'Names and add symbols stay in one row');
  assert.equal(await catalog.evaluate(e=>e.scrollWidth>e.clientWidth),false);
  const layerHeights=await page.locator('.layer-row').evaluateAll(rows=>rows.map(row=>row.getBoundingClientRect().height));assert.ok(layerHeights.every(height=>height<=62),'Narrow layer rows do not grow with wrapped metadata');
  await page.screenshot({path:'artifacts/screenshots/compact-minimum-catalog.png'});
  // Panel-local dialogs must cover the application, not inherit the panel bounds.
  await page.getByRole('button',{name:'Распределить объекты',exact:true}).click();let dialog=page.getByRole('dialog');
  let scrim=await page.locator('.modal-scrim').boundingBox();const viewport=await page.evaluate(()=>({width:innerWidth,height:innerHeight}));assert.equal(scrim.x,0);assert.equal(scrim.y,0);assert.equal(scrim.width,viewport.width);assert.equal(scrim.height,viewport.height);
  await page.keyboard.press('F10');assert.equal(await dialog.evaluate(d=>d.contains(document.activeElement)),true);await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);
  await page.getByRole('button',{name:'Управление холстом',exact:true}).click();dialog=page.getByRole('dialog');await expect(dialog).toContainText('Колесо');await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Справка по областям уведомления',exact:true}).click();dialog=page.getByRole('dialog');await expect(dialog).toContainText('общие');await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Управление холстом',exact:true}).click();const mainWindow=await app.browserWindow(page);await mainWindow.evaluate(w=>w.close());
  await expect(page.getByRole('dialog',{name:'Закрыть AlertStudio?',exact:true})).toBeVisible();await expect(page.getByRole('dialog')).toHaveCount(1);
  await page.getByRole('dialog').getByRole('button',{name:'Отмена',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);
  await menuCommand(page,'window','Слои');await expect(page.getByRole('tab',{name:'Слои',exact:true})).toHaveCount(1);
  assert.deepEqual(await state(),before);
  await page.locator('#menu-trigger-edit').click();await page.getByRole('menuitemcheckbox',{name:'English',exact:true}).click();
  await expect(page.getByRole('button',{name:'Canvas controls',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Organize objects',exact:true})).toBeVisible();
  assert.deepEqual(errors,[]);await writeFile('artifacts/compact-layout-ui-results.json',JSON.stringify({date:new Date().toISOString(),measurements,tests:['900x650, 1920x1080, 2560x1440','compact header/workspaces/tools/status','content-sized sequence','120px catalog via native splitter','single-row object buttons','dialog viewport bounds','F10 respects dialogs','help remains accessible','RU/EN','layout does not edit project'],errors},null,2));
  console.log('Compact layout Electron smoke passed',measurements.map(m=>({label:m.label,header:m.header.height,workspace:m.workspace.height,toolbar:m.toolbar.height,canvas:m.canvas.height})));
}finally{if(app){for(const[i,p]of app.windows().entries())await p.screenshot({path:`artifacts/screenshots/compact-layout-last-${i}.png`}).catch(()=>{});await app.evaluate(({app})=>app.exit(0)).catch(()=>{});await app.close().catch(()=>{});}}
