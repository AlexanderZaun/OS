import {appCommand,ensurePanelManager} from './menu-helpers.mjs';
import { _electron as electron, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

const root = path.resolve(`.test-data/recovery-${randomUUID()}`);
const projectFolder = path.join(root,'Project');
const restoredFolder = path.join(root,'Restored');
const screenshotRoot = path.resolve('artifacts/screenshots');
for(const folder of [root,projectFolder,restoredFolder,screenshotRoot])await mkdir(folder,{recursive:true});
const running = new Set();
const errors = [];

async function launch(profile) {
  const env = {...process.env,ALERT_STUDIO_DATA:path.join(root,profile)};
  delete env.ELECTRON_RUN_AS_NODE;
  const app = await electron.launch({args:['.'],env,timeout:30000});
  running.add(app);
  const page = await app.firstWindow();
  page.setDefaultTimeout(15000);
  page.on('pageerror',error=>errors.push(error.message));
  await page.getByRole('heading',{name:'Создайте следующий яркий момент.'}).waitFor();
  return {app,page};
}

async function selectFolder(app,folder) {
  await app.evaluate(({dialog},folder)=>{
    dialog.showOpenDialog=async()=>({canceled:false,filePaths:[folder]});
  },folder);
}

async function crash(app) {
  await app.evaluate(({app})=>app.exit(77)).catch(()=>{});
  await app.close().catch(()=>{});
  running.delete(app);
}

async function waitSaved(page, folder) {
  await expect.poll(async () => page.evaluate(async folder => {
    const state = await window.studio.session();
    const snapshot = await window.studio.snapshot();
    return !snapshot.dirty && state.folder?.toLowerCase() === folder.toLowerCase();
  }, folder)).toBe(true);
  await expect.poll(async () => readFile(path.join(folder,'project.json'),'utf8').catch(()=>null)).not.toBeNull();
}

try {
  let primary = await launch('primary');
  await primary.page.getByRole('button',{name:'Создать проект →'}).click();await ensurePanelManager(primary.page);
  await primary.page.getByRole('button',{name:'Текст +',exact:true}).click();
  await primary.page.getByLabel('Текст',{exact:true}).fill('Сохранённый проект');
  await selectFolder(primary.app,projectFolder);
  await appCommand(primary.page,'Сохранить');
  await waitSaved(primary.page,projectFolder);
  const originalIndex = await readFile(path.join(projectFolder,'project.json'),'utf8');
  await primary.page.getByLabel('Текст',{exact:true}).fill('Черновик после аварии');
  await expect(primary.page.getByTestId('autosave-status')).toHaveAttribute('data-state','saved');
  assert.equal(await readFile(path.join(projectFolder,'project.json'),'utf8'),originalIndex);
  const draftRevision = (await primary.page.evaluate(()=>window.studio.snapshot())).revision;
  await primary.page.getByRole('button',{name:'Воспроизвести',exact:true}).click();
  await primary.page.waitForTimeout(150);
  assert.equal((await primary.page.evaluate(()=>window.studio.snapshot())).revision,draftRevision);
  await primary.page.getByRole('button',{name:'Пауза',exact:true}).click();
  await primary.page.screenshot({path:path.join(screenshotRoot,'autosave.png')});

  const secondary = await launch('secondary');
  await selectFolder(secondary.app,projectFolder);
  await appCommand(secondary.page,'Открыть');
  await expect(secondary.page.getByRole('status')).toContainText('уже открыта в другом процессе');
  assert.equal((await secondary.page.evaluate(()=>window.studio.snapshot())).project.objects.length,0);
  await crash(secondary.app);
  await crash(primary.app); // no before-quit cleanup: exercise crash recovery

  primary = await launch('primary');
  await appCommand(primary.page,'Черновики восстановления');
  const recoveryDialog = primary.page.getByRole('dialog',{name:'Черновики восстановления'});
  await recoveryDialog.getByRole('button',{name:'Восстановить черновик'}).waitFor();
  await primary.page.screenshot({path:path.join(screenshotRoot,'recovery.png')});
  await recoveryDialog.getByRole('button',{name:'Восстановить черновик'}).click();
  await primary.page.getByRole('alert').filter({hasText:'Открыт восстановленный черновик'}).waitFor();
  const restored = await primary.page.evaluate(()=>window.studio.snapshot());
  assert.equal(restored.project.objects[0].settings.content,'Черновик после аварии');
  assert.equal(restored.dirty,true);
  assert.equal((await primary.page.evaluate(()=>window.studio.session())).folder,null);
  assert.equal(await readFile(path.join(projectFolder,'project.json'),'utf8'),originalIndex);
  await selectFolder(primary.app,restoredFolder);
  await appCommand(primary.page,'Сохранить');
  await waitSaved(primary.page,restoredFolder);
  assert.deepEqual(await primary.page.evaluate(()=>window.studio.recoveries()),[]);

  await writeFile(path.join(projectFolder,'project.json'),'{damaged');
  await selectFolder(primary.app,projectFolder);
  await appCommand(primary.page,'Открыть');
  await primary.page.getByRole('alert').filter({hasText:'Основной индекс проекта повреждён'}).waitFor();
  assert.equal((await primary.page.evaluate(()=>window.studio.snapshot())).project.objects[0].settings.content,'Сохранённый проект');
  assert.equal((await primary.page.evaluate(()=>window.studio.snapshot())).dirty,true);
  await primary.page.screenshot({path:path.join(screenshotRoot,'backup-recovery.png')});
  await appCommand(primary.page,'Сохранить');
  await waitSaved(primary.page,projectFolder);

  await primary.app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setSize(900,650));
  await appCommand(primary.page,'Расширения');
  await primary.page.getByRole('dialog',{name:'Расширения'}).waitFor();
  await primary.page.screenshot({path:path.join(screenshotRoot,'extensions-compact.png')});
  await primary.page.keyboard.press('Escape');
  await expect(primary.page.getByRole('dialog')).toHaveCount(0);
  const dimensions = await primary.page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));
  assert.ok(dimensions.scrollWidth<=dimensions.width);
  await primary.page.screenshot({path:path.join(screenshotRoot,'editor-compact.png')});
  await primary.app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setSize(1920,1080));
  console.log('Theme audit', await primary.page.evaluate(()=>Array.from(document.querySelectorAll('.studio-workspace,.dockview-theme-dark,.dv-tabs-and-actions-container')).slice(0,8).map(e=>({className:e.className,bg:getComputedStyle(e).backgroundColor,theme:getComputedStyle(e).getPropertyValue('--dv-tabs-and-actions-container-background-color')}))));
  await primary.page.screenshot({path:path.join(screenshotRoot,'editor-1080.png')});
  await primary.page.locator('.layer-row button').first().click();
  await primary.page.getByLabel('Текст',{exact:true}).fill('Черновик при обычном выходе');
  await expect.poll(async()=>primary.page.evaluate(async()=>(await window.studio.snapshot()).project.objects[0].settings.content)).toBe('Черновик при обычном выходе');
  const closed = primary.app.waitForEvent('close',{timeout:15000});
  const mainWindow=await primary.app.browserWindow(primary.page);await mainWindow.evaluate(w=>w.close());
  await primary.page.getByRole('dialog',{name:'Закрыть AlertStudio?',exact:true}).getByRole('button',{name:'Сохранить и закрыть',exact:true}).click();
  await closed;
  running.delete(primary.app);
  primary = await launch('primary');
  assert.deepEqual(await primary.page.evaluate(()=>window.studio.recoveries()),[]);
  await selectFolder(primary.app,projectFolder);await appCommand(primary.page,'Открыть');
  await expect.poll(async()=>primary.page.evaluate(async()=>(await window.studio.snapshot()).project.objects[0]?.settings.content)).toBe('Черновик при обычном выходе');
  assert.deepEqual(errors,[]);
  await writeFile('artifacts/recovery-ui-results.json',JSON.stringify({date:new Date().toISOString(),platform:process.platform,root,tests:['debounced draft leaves explicit project unchanged','playback leaves revision unchanged','second process rejected','crash recovery from UI','restore is unsaved copy','Save clears recovery candidate','damaged index opens previous version with notice','compact dialog Escape and viewport','1920x1080 viewport','Save and close persists latest edit and dismisses recovery candidate'],errors},null,2));
  console.log('Recovery + theme Electron smoke passed.');
} finally {
  for(const app of running) {
    for(const [i,page] of app.windows().entries())await page.screenshot({path:path.join(screenshotRoot,`recovery-last-${i}.png`)}).catch(()=>{});
    await app.evaluate(({app})=>app.exit(0)).catch(()=>{});
    await app.close().catch(()=>{});
  }
}
