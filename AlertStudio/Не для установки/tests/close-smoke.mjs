import {appCommand,ensurePanelManager} from './menu-helpers.mjs';
import {_electron as electron,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
import {resizeWindow} from './window-helpers.mjs';
const root=path.resolve(`.test-data/close-${randomUUID()}`),folder=path.join(root,'Project');await mkdir(folder,{recursive:true});await mkdir('artifacts/screenshots',{recursive:true});
const running=new Set(),errors=[];
async function launch(profile){const env={...process.env,ALERT_STUDIO_DATA:path.join(root,profile)};delete env.ELECTRON_RUN_AS_NODE;const app=await electron.launch({args:['.'],env});running.add(app);const page=await app.firstWindow();page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));await page.getByRole('button',{name:'Создать проект →'}).waitFor();return {app,page};}
async function request(app,quit=false){if(quit)await app.evaluate(({app})=>app.quit());else {const page=app.windows().find(p=>!p.url().includes('?panel='));const window=await app.browserWindow(page);await window.evaluate(w=>w.close());}}
async function closeWith(app,page,label){const closed=app.waitForEvent('close',{timeout:15000});await page.getByRole('dialog').getByRole('button',{name:label,exact:true}).click();await closed;running.delete(app);}
async function selectFolder(app,folder){await app.evaluate(({dialog},folder)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[folder]});},folder);}
async function cleanClose(app){const closed=app.waitForEvent('close',{timeout:15000});await request(app).catch(()=>{});await closed;running.delete(app);}
try{
  let {app,page}=await launch('saved');await page.getByRole('button',{name:'Создать проект →'}).click();await ensurePanelManager(page);await page.getByRole('button',{name:'Текст +',exact:true}).click();await page.getByLabel('Текст',{exact:true}).fill('Saved on close');
  const initial=await page.evaluate(()=>window.studio.snapshot());
  const childPromise=app.waitForEvent('window');await page.getByRole('button',{name:'Свойства ↗',exact:true}).click();let child=await childPromise;await child.getByLabel('Текст',{exact:true}).waitFor();
  await child.close();assert.equal(app.windows().length,1);await expect(page.getByRole('dialog')).toHaveCount(0);
  await app.evaluate(({dialog})=>{dialog.showOpenDialog=()=>new Promise(resolve=>{globalThis.resolveCloseFolder=resolve;});});
  await appCommand(page,'Сохранить');await expect.poll(()=>app.evaluate(()=>typeof globalThis.resolveCloseFolder)).toBe('function');
  await request(app);assert.equal(await page.evaluate(()=>window.studio.closeState()),null);await expect(page.getByRole('dialog')).toHaveCount(0);
  await app.evaluate(()=>globalThis.resolveCloseFolder({canceled:true,filePaths:[]}));
  let dialog=page.getByRole('dialog',{name:'Закрыть AlertStudio?',exact:true});await expect(dialog).toBeVisible();await expect(dialog.getByRole('button',{name:'Отмена',exact:true})).toBeFocused();
  await page.keyboard.press('Enter');await expect(dialog).toHaveCount(0);assert.deepEqual(await page.evaluate(()=>window.studio.snapshot()),initial);
  const childAgain=app.waitForEvent('window');await page.getByRole('button',{name:'Свойства ↗',exact:true}).click();child=await childAgain;await child.getByLabel('Текст',{exact:true}).waitFor();
  await request(app);dialog=page.getByRole('dialog',{name:'Закрыть AlertStudio?',exact:true});await expect(dialog).toBeVisible();await expect(child.getByLabel('Текст',{exact:true})).toBeDisabled();await expect(child.getByRole('dialog')).toHaveCount(0);
  const state=await page.evaluate(()=>window.studio.closeState());
  assert.equal(await child.evaluate(async id=>{try{await window.studio.respondClose(id,'discard');return false;}catch{return true;}},state.id),true);
  assert.equal(await child.evaluate(async id=>{try{await window.studio.command({type:'set',id,key:'content',value:'Blocked'});return false;}catch{return true;}},initial.selected),true);
  await request(app);assert.equal((await page.evaluate(()=>window.studio.closeState())).id,state.id);await expect(page.getByRole('dialog')).toHaveCount(1);
  await resizeWindow(app,page,1920,1080);await page.screenshot({path:'artifacts/screenshots/close-1080.png'});await resizeWindow(app,page,900,650);await page.screenshot({path:'artifacts/screenshots/close-compact.png'});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(child.getByLabel('Текст',{exact:true})).toBeEnabled();
  await appCommand(page,'RU');await request(app);dialog=page.getByRole('dialog',{name:'Close AlertStudio?',exact:true});await expect(dialog.getByRole('button',{name:'Save and close',exact:true})).toBeVisible();await dialog.getByRole('button',{name:'Cancel',exact:true}).click();await appCommand(page,'EN');
  await app.evaluate(({dialog})=>{dialog.showOpenDialog=()=>new Promise(resolve=>{globalThis.resolveCloseFolder=resolve;});});
  await request(app);dialog=page.getByRole('dialog',{name:'Закрыть AlertStudio?',exact:true});await dialog.getByRole('button',{name:'Сохранить и закрыть',exact:true}).click();await expect(dialog).toContainText('Сохранение проекта…');await expect(dialog.getByRole('button',{name:'Отмена',exact:true})).toBeDisabled();
  await page.keyboard.press('Escape');await page.keyboard.press('Tab');await expect(dialog).toBeFocused();await expect(dialog).toBeVisible();
  await app.evaluate(()=>globalThis.resolveCloseFolder({canceled:true,filePaths:[]}));await expect(dialog).toContainText('Выбор папки отменён');assert.deepEqual(await page.evaluate(()=>window.studio.snapshot()),initial);
  await selectFolder(app,path.join(root,'Missing'));await dialog.getByRole('button',{name:'Сохранить и закрыть',exact:true}).click();await expect(dialog).toContainText('Не удалось сохранить проект');assert.equal((await page.evaluate(()=>window.studio.snapshot())).dirty,true);assert.equal(app.windows().length,2);
  await selectFolder(app,folder);await closeWith(app,page,'Сохранить и закрыть');
  const index=JSON.parse(await readFile(path.join(folder,'project.json'),'utf8'));const content=JSON.parse(await readFile(path.join(folder,'revisions',index.revision,'scenes/main/objects',initial.selected,'settings/content.json'),'utf8'));assert.equal(content.value,'Saved on close');
  ({app,page}=await launch('saved'));assert.deepEqual(await page.evaluate(()=>window.studio.recoveries()),[]);await selectFolder(app,folder);await appCommand(page,'Открыть');await page.locator('.layer-row button').first().click();await expect(page.getByLabel('Текст',{exact:true})).toHaveValue('Saved on close');
  const savedIndex=await readFile(path.join(folder,'project.json'),'utf8');await page.getByLabel('Текст',{exact:true}).fill('Discard on close');await expect(page.getByTestId('autosave-status')).toHaveAttribute('data-state','saved');
  await request(app);await closeWith(app,page,'Закрыть без сохранения');assert.equal(await readFile(path.join(folder,'project.json'),'utf8'),savedIndex);
  const metadata=JSON.parse(await readFile(path.join(root,'saved/Recovery',initial.project.id,'recovery.json'),'utf8'));assert.equal(metadata.active,false);
  ({app,page}=await launch('saved'));assert.deepEqual(await page.evaluate(()=>window.studio.recoveries()),[]);await selectFolder(app,folder);await appCommand(page,'Открыть');await page.locator('.layer-row button').first().click();await expect(page.getByLabel('Текст',{exact:true})).toHaveValue('Saved on close');await cleanClose(app);
  ({app,page}=await launch('unsaved'));await page.getByRole('button',{name:'Создать проект →'}).click();await ensurePanelManager(page);await page.getByRole('button',{name:'Текст +',exact:true}).click();await expect(page.getByTestId('autosave-status')).toHaveAttribute('data-state','saved');
  await request(app,true);await expect(page.getByRole('dialog',{name:'Закрыть AlertStudio?',exact:true})).toBeVisible();await closeWith(app,page,'Закрыть без сохранения');
  ({app,page}=await launch('unsaved'));assert.deepEqual(await page.evaluate(()=>window.studio.recoveries()),[]);await cleanClose(app);
  assert.deepEqual(errors,[]);await writeFile('artifacts/close-ui-results.json',JSON.stringify({date:new Date().toISOString(),checks:['main close exits all windows; detached close affects only panel','Cancel default and Enter/Escape','RU/EN shared themed dialog','single prompt; owner and mutation IPC guards','folder cancellation and save failure keep document open','saving disables cancellation and traps focus','Save and close writes latest values','Discard preserves saved revision and dismisses current recovery','unsaved discard and app.quit route','clean close without confirmation','900x650 and 1920x1080'],errors},null,2));console.log('Close workflow Electron smoke passed');
}finally{for(const app of running){for(const [i,page] of app.windows().entries())await page.screenshot({path:`artifacts/screenshots/close-last-${i}.png`}).catch(()=>{});await app.evaluate(({app})=>app.exit(0)).catch(()=>{});await app.close().catch(()=>{});}}
