import {_electron as electron,expect} from '@playwright/test';
import {promises as fs} from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {appCommand,menuCommand} from '../tests/menu-helpers.mjs';
import {resizeWindow,waitForCanvasFit,isolateDesktopPointer} from '../tests/window-helpers.mjs';
const root=path.resolve(import.meta.dirname,'..'),assets=path.join(root,'presentation','assets');
await fs.mkdir(assets,{recursive:true});
const env={...process.env,ALERT_STUDIO_DATA:path.join(root,'.test-data',`presentation-${randomUUID()}`)};delete env.ELECTRON_RUN_AS_NODE;
const app=await electron.launch({args:['.'],cwd:root,env});const page=await app.firstWindow();page.setDefaultTimeout(15000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
  await isolateDesktopPointer(app,page);await app.evaluate(({dialog})=>{dialog.showMessageBox=async()=>({response:1});});
  for(const language of ['ru','en']){
    if(language==='en')await appCommand(page,'RU');
    await menuCommand(page,'file',language==='ru'?'Сцена-пример':'Example scene');
    await expect(page.locator('.canvas-stage canvas')).toBeVisible();
    await page.evaluate(()=>window.studio.command({type:'add',effect:'text'}));
    await page.evaluate(async language=>{const s=await window.studio.snapshot(),id=s.selected;for(const [key,value]of Object.entries({content:language==='ru'?'Спасибо за поддержку!':'Thanks for your support!',size:64,x:960,y:540}))await window.studio.command({type:'set',id,key,value});await window.studio.command({type:'select',id:null});await window.studio.playbackCommand({type:'seek',time:6});},language);
    await resizeWindow(app,page,1920,1080);await waitForCanvasFit(page);
    await expect.poll(async()=>page.evaluate(async()=>(await window.studio.session()).autosave)).toBe('saved');
    await page.locator('.canvas-stage').click({position:{x:12,y:12}});await page.keyboard.press('Home');await waitForCanvasFit(page);
    await page.screenshot({path:path.join(assets,`editor-${language}.png`)});
    if(language==='ru')await fs.writeFile(path.join(assets,'composition.png'),Buffer.from((await page.locator('.canvas-stage canvas').evaluate(c=>c.toDataURL('image/png'))).split(',')[1],'base64'));
  }
  if(errors.length)throw Error(errors.join('\n'));
  console.log('Captured real RU/EN editor and composition without personal data');
}finally{await app.evaluate(({app})=>app.exit(0)).catch(()=>{});await app.close().catch(()=>{});}
