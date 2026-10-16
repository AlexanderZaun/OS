import {_electron as electron} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import path from 'node:path';
const data=path.resolve(`.test-data/${randomUUID()}`);await mkdir(data,{recursive:true});await mkdir('artifacts/screenshots',{recursive:true});
const env={...process.env,ALERT_STUDIO_DATA:data};delete env.ELECTRON_RUN_AS_NODE;
const errors=[];let app;
async function launch(extra=[]){app=await electron.launch({args:['.',...extra],env,timeout:30000});const page=await app.firstWindow();page.setDefaultTimeout(10000);page.on('console',m=>{if(m.type()==='error')console.error('Console:',m.text());});page.on('pageerror',e=>{errors.push(e.message);console.error('Renderer error:',e.message);});await page.getByRole('heading',{name:'Создайте следующий яркий момент.'}).waitFor();return page;}
async function dialogFolder(folder){await app.evaluate(({dialog},p)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[p]});},path.resolve(folder));}
async function close(){await app.evaluate(({app})=>app.exit(0));await app.close().catch(()=>{});}
try {
  let page=await launch();await page.screenshot({path:'artifacts/screenshots/start.png'});
  await page.getByRole('button',{name:'Создать проект →'}).click();console.log('Project created');await page.getByRole('button',{name:'Текст +',exact:true}).click();console.log('Text added');
  await page.getByLabel('Текст',{exact:true}).fill('Привет, стрим!');
  await page.getByRole('button',{name:'Дублировать',exact:true}).click();
  await page.getByLabel('Текст',{exact:true}).fill('Второй слой');
  await page.getByLabel('Положение Y',{exact:true}).fill('700');
  const state=await page.evaluate(()=>window.studio.snapshot());assert.equal(state.project.objects.length,2);assert.equal(state.project.objects[0].settings.content,'Привет, стрим!');
  const childPromise=app.waitForEvent('window');await page.getByRole('button',{name:'Свойства ↗'}).click();
  const child=await childPromise;child.setDefaultTimeout(10000);await child.getByLabel('Текст',{exact:true}).waitFor();await child.getByLabel('Текст',{exact:true}).fill('Общее состояние');
  await page.getByLabel('Текст',{exact:true}).filter({visible:true}).waitFor();
  assert.equal(await page.getByLabel('Текст',{exact:true}).inputValue(),'Общее состояние');
  await page.getByRole('button',{name:'Отменить',exact:true}).click();await child.getByLabel('Текст',{exact:true}).waitFor();
  assert.equal(await child.getByLabel('Текст',{exact:true}).inputValue(),'Второй слой');await child.close();
  const projectFolder=path.join(data,'SavedProject');await mkdir(projectFolder);await dialogFolder(projectFolder);await page.getByRole('button',{name:'Сохранить',exact:true}).click();
  await page.waitForFunction(async()=>!(await window.studio.snapshot()).dirty);
  await page.screenshot({path:'artifacts/screenshots/editor.png'});
  await page.getByRole('button',{name:'Расширения',exact:true}).click();
  await dialogFolder('dist/packages/project-info');await page.getByRole('button',{name:'Установить папку пакета'}).click();await page.getByRole('status').filter({hasText:'project-info'}).waitFor();
  await dialogFolder('dist/packages/orbit');await page.getByRole('button',{name:'Установить папку пакета'}).click();await page.getByRole('status').filter({hasText:'orbit'}).waitFor();
  await close();page=await launch();
  await dialogFolder(projectFolder);await page.getByRole('button',{name:'Открыть',exact:true}).click();
  await page.getByRole('button',{name:'Информация о проекте +',exact:true}).click();await page.getByRole('heading',{name:'Внешняя панель проекта'}).waitFor();
  await page.getByRole('button',{name:'Орбита · внешний эффект +',exact:true}).click();
  await page.getByTestId('external-revision').filter({hasText:'3 objects'}).waitFor();
  await page.getByRole('button',{name:'Холст +',exact:true}).click();
  const alpha=await page.locator('canvas').last().evaluate(c=>{const a=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let clear=0,visible=0;for(let i=3;i<a.length;i+=4){if(a[i]===0)clear++;else visible++;}return {clear,visible};});
  assert.ok(alpha.clear>0&&alpha.visible>0);await page.screenshot({path:'artifacts/screenshots/extensions.png'});
  await page.getByRole('button',{name:'RU',exact:true}).click();await page.getByRole('button',{name:'Save',exact:true}).waitFor();
  assert.deepEqual(errors,[]);await close();
  page=await launch(['--safe']);await page.getByRole('button',{name:'Создать проект →'}).click();assert.equal(await page.getByRole('button',{name:'Орбита · внешний эффект +',exact:true}).count(),0);await close();
  await writeFile('artifacts/ui-results.json',JSON.stringify({date:new Date().toISOString(),platform:process.platform,tests:['Windows Electron launch','text editing and independent duplicate','shared detached panel and history','save/open','panel + effect installed after build and restart','external effect renders nonempty alpha canvas','RU/EN switch','safe mode'],errors,data},null,2));
  console.log('Electron smoke passed. Evidence: artifacts/screenshots and artifacts/ui-results.json');
} finally {if(app){for(const [i,p] of app.windows().entries()){await p.screenshot({path:`artifacts/screenshots/last-${i}.png`}).catch(()=>{});}await app.evaluate(({app})=>app.exit(0)).catch(()=>{});await app.close().catch(()=>{});}}
