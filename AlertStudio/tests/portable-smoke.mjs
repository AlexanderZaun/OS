import {_electron as electron,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {promises as fs} from 'node:fs';
import path from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {verifyPortable} from '../tools/verify-portable.mjs';
import {resizeWindow,isolateDesktopPointer} from './window-helpers.mjs';
import {menuCommand} from './menu-helpers.mjs';

const root=path.resolve(import.meta.dirname,'..');
const pkg=JSON.parse(await fs.readFile(path.join(root,'package.json'),'utf8'));
const base=`AlertStudio-${pkg.version}-Windows-x64`,zip=path.join(root,'release',`${base}.zip`);
const run=path.join(root,'.test-data',`portable-${randomUUID()}`),unrelated=path.join(run,'unrelated');
const source=path.join(run,base),destinationRoot=path.resolve(process.env.ALERT_STUDIO_TEST_DRIVE??'E:\\',`AlertStudio-portable-test-${randomUUID()}`);
const destination=path.join(destinationRoot,'Переезд приложения с пробелами');
const screenshots=path.join(root,'artifacts','screenshots');
await fs.mkdir(unrelated,{recursive:true});await fs.mkdir(screenshots,{recursive:true});
const tar=spawnSync(path.join(process.env.SystemRoot??'C:\\Windows','System32','tar.exe'),['-x','-f',zip,'-C',run],{windowsHide:true,encoding:'utf8'});
assert.equal(tar.status,0,tar.stderr);const inventory=await verifyPortable(source);
const expected=(await fs.readFile(`${zip}.sha256`,'utf8')).split(/\s/)[0];
assert.equal(createHash('sha256').update(await fs.readFile(zip)).digest('hex'),expected);
const errors=[],externalRequests=[];let app,page,projectFolder,projectId,textId,storedLayout;
async function launch(folder){
  const env={...process.env,PATH:`${process.env.SystemRoot}\\System32;${process.env.SystemRoot}`,ALERT_STUDIO_DATA:path.join(run,'must-not-be-used')};delete env.ELECTRON_RUN_AS_NODE;
  app=await electron.launch({executablePath:path.join(folder,'AlertStudio.exe'),args:['--host-resolver-rules=MAP * ~NOTFOUND'],cwd:unrelated,env,timeout:40000});
  page=await app.firstWindow();page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(/^https?:/.test(r.url()))externalRequests.push(r.url());});
  await page.getByRole('heading',{name:'Создайте следующий яркий момент.'}).waitFor();await isolateDesktopPointer(app,page);
  const runtime=await app.evaluate(({app})=>({packaged:app.isPackaged,profile:app.getPath('userData'),appPath:app.getAppPath(),exe:app.getPath('exe')}));
  assert.equal(runtime.packaged,true);assert.equal(runtime.profile,path.join(folder,'Data','Profile'));assert.equal(runtime.appPath,path.join(folder,'resources','app'));
  assert.equal(await page.evaluate(()=>typeof window.require),'undefined');
  console.log('Standalone launch:',runtime.exe);
}
async function stop(){if(!app)return;await app.evaluate(async({session})=>{await session.defaultSession.flushStorageData();});await app.evaluate(({app})=>app.exit(0)).catch(()=>{});await app.close().catch(()=>{});app=undefined;}
try{
  await launch(source);
  await page.getByRole('button',{name:'Создать проект →'}).click();await page.getByRole('button',{name:'Текст +',exact:true}).click();
  const state=await page.evaluate(()=>window.studio.snapshot());projectId=state.project.id;textId=state.selected;
  await page.getByLabel('Текст',{exact:true}).fill('Переносимый проект');
  await app.evaluate(({dialog})=>{dialog.showOpenDialog=async()=>{throw Error('First portable Save must not need folder configuration');};});
  projectFolder=await page.evaluate(()=>window.studio.save());assert.ok(projectFolder.startsWith(path.join(source,'Data','Projects')+path.sep));
  assert.equal((await page.evaluate(()=>window.studio.snapshot())).dirty,false);
  const index=JSON.parse(await fs.readFile(path.join(projectFolder,'project.json'),'utf8'));assert.equal(index.objects,undefined);
  await expect.poll(async()=>page.locator('.canvas-stage canvas').evaluate(c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data.some((v,i)=>i%4===3&&v>0))).toBe(true);
  const png=path.join(run,'portable.png');await app.evaluate(({dialog},p)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:p});},png);
  await menuCommand(page,'file','Экспорт кадра в PNG…');await expect(page.locator('footer')).toContainText('PNG сохранён');
  const bytes=await fs.readFile(png);assert.equal(bytes.readUInt32BE(16),1920);assert.equal(bytes.readUInt32BE(20),1080);
  const childPromise=app.waitForEvent('window');await page.evaluate(()=>window.studio.detach('properties'));const child=await childPromise;child.on('pageerror',e=>errors.push(e.message));await expect(child.getByLabel('Текст',{exact:true})).toHaveValue('Переносимый проект');await child.close();
  // Install a separately built trusted example, then verify it survives the relocation.
  await app.evaluate(({dialog},p)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[p]});},path.join(root,'dist','packages','orbit'));
  assert.equal(await page.evaluate(()=>window.studio.install()),'orbit');
  await page.getByLabel('Текст',{exact:true}).fill('Черновик после переноса');
  await expect.poll(async()=>page.evaluate(async()=>(await window.studio.session()).autosave)).toBe('saved');
  const metadata=JSON.parse(await fs.readFile(path.join(source,'Data','Recovery',projectId,'recovery.json'),'utf8'));assert.equal(metadata.origin,null);assert.ok(metadata.originRelative.startsWith('Data/Projects/'));
  await page.evaluate(()=>localStorage.setItem('portable-test-marker','retained'));
  storedLayout=await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([k])=>!k.includes('portable-test-marker'))));
  await stop(); // abrupt exit deliberately leaves a recovery candidate
  assert.ok(path.parse(source).root.toLowerCase()!==path.parse(destination).root.toLowerCase(),'Use a genuinely different test drive');
  await fs.mkdir(destinationRoot,{recursive:false});await fs.cp(source,destination,{recursive:true,errorOnExist:true,force:false});
  // Remove access to the original pathname; all assets and profile must come from the new drive.
  assert.equal(path.dirname(source),run);await fs.rename(source,source+'-unavailable');
  await launch(destination);assert.equal(await page.evaluate(()=>localStorage.getItem('portable-test-marker')),'retained');
  const movedLayout=await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([k])=>!k.includes('portable-test-marker'))));assert.deepEqual(movedLayout,storedLayout);
  assert.ok((await page.evaluate(()=>window.studio.extensions())).some(e=>e.manifest.id==='orbit'));
  const drafts=await page.evaluate(()=>window.studio.recoveries());assert.equal(drafts[0].origin,path.join(destination,path.relative(source,projectFolder)));
  const movedProject=path.join(destination,path.relative(source,projectFolder));
  await app.evaluate(({dialog},p)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[p]});},movedProject);
  await menuCommand(page,'file','Открыть');await expect(page.locator('.canvas-stage canvas')).toBeVisible();await page.evaluate(id=>window.studio.command({type:'select',id}),textId);await expect(page.getByLabel('Текст',{exact:true})).toHaveValue('Переносимый проект');
  assert.equal(await page.evaluate(id=>window.studio.restoreDraft(id),projectId),true);await page.evaluate(id=>window.studio.command({type:'select',id}),textId);await expect(page.getByLabel('Текст',{exact:true})).toHaveValue('Черновик после переноса');
  assert.equal(await page.evaluate(()=>window.studio.save()),movedProject);
  await page.getByRole('button',{name:'Орбита · внешний эффект +',exact:true}).click();
  assert.equal((await page.evaluate(()=>window.studio.snapshot())).project.objects.at(-1).type,'orbit');
  await page.evaluate(()=>window.studio.save());
  for(const [width,height]of [[900,650],[1920,1080]]){await resizeWindow(app,page,width,height);await page.screenshot({path:path.join(screenshots,`portable-${width}.png`)});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  assert.deepEqual(errors,[]);assert.deepEqual(externalRequests,[]);
  await assert.rejects(fs.access(path.join(run,'must-not-be-used')));
  await verifyPortable(path.join(root,'release',base));
  await fs.writeFile(path.join(root,'artifacts','portable-results.json'),JSON.stringify({date:new Date().toISOString(),version:pkg.version,archive:zip,sha256:expected,inventory,from:source,to:destination,checks:['actual ZIP extraction','packaged EXE without developer PATH','unrelated working directory','offline assets','automatic portable Save','multi-file project','PNG export','detached properties','profile and layout relocation','installed extension relocation','recovery origin rebasing','open and recover after cross-drive move','900x650 and 1920x1080','pristine distribution excludes user data'],errors,externalRequests},null,2));
  console.log('Portable ZIP, offline launch and actual cross-drive relocation passed');
}finally{
  if(app){await page?.screenshot({path:path.join(screenshots,'portable-last.png')}).catch(()=>{});await stop().catch(()=>{});}
  // This exact, freshly generated test root is the only outside-workspace tree we remove.
  if(path.basename(destinationRoot).startsWith('AlertStudio-portable-test-')&&path.dirname(destination)===destinationRoot){
    try{const resolved=await fs.realpath(destinationRoot);assert.equal(resolved.toLowerCase(),destinationRoot.toLowerCase());await fs.rm(resolved,{recursive:true,force:true});}catch(error){if(error.code!=='ENOENT')throw error;}
  }
}
