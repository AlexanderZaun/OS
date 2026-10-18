import {_electron as electron,expect} from '@playwright/test';
import {promises as fs} from 'node:fs';
import path from 'node:path';
import {createServer} from 'node:http';
import {randomUUID} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..'),site=path.join(root,'presentation'),data=path.join(root,'.test-data',`website-${randomUUID()}`);
await fs.mkdir(data,{recursive:true});await fs.mkdir(path.join(root,'artifacts','screenshots'),{recursive:true});
const preview=path.join(data,'preview.cjs');
await fs.writeFile(preview,"const {app,BrowserWindow}=require('electron');app.whenReady().then(()=>{const w=new BrowserWindow({width:1440,height:1080,show:false,webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true}});w.loadURL(process.env.ALERT_STUDIO_SITE_URL);});");
const server=createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');const name=decodeURIComponent(url.pathname);let file=path.resolve(site,'.'+name);const rel=path.relative(site,file);if(path.isAbsolute(rel)||rel==='..'||rel.startsWith('..'+path.sep))throw Error('Invalid path');if((await fs.stat(file)).isDirectory())file=path.join(file,'index.html');const bytes=await fs.readFile(file);res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.css':'text/css','.png':'image/png','.svg':'image/svg+xml'})[path.extname(file)]??'application/octet-stream');res.end(bytes);}catch{res.writeHead(404);res.end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const url=`http://127.0.0.1:${server.address().port}`;
const env={...process.env,ALERT_STUDIO_SITE_URL:url};delete env.ELECTRON_RUN_AS_NODE;
let app;const errors=[];
try{
 app=await electron.launch({args:[preview],cwd:root,env});const page=await app.firstWindow();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 for(const language of ['ru','en']){
  await page.goto(url+(language==='en'?'/en/':'/'));await expect(page.locator('html')).toHaveAttribute('lang',language);await expect(page.locator('h1')).toBeVisible();
  await expect.poll(()=>page.locator('#editor img').evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
  const pkg=JSON.parse(await fs.readFile(path.join(root,'package.json'),'utf8'));await expect(page.locator('[data-download]').first()).toHaveAttribute('href',`https://github.com/AlexanderZaun/OS/releases/download/v${pkg.version}/AlertStudio-${pkg.version}-Windows-x64.zip`);
  for(const [width,height]of [[1440,1080],[900,650],[390,844]]){
   const handle=await app.browserWindow(page);await handle.evaluate((w,[width,height])=>w.setContentSize(width,height),[width,height]);
   await page.waitForFunction(([w,h])=>innerWidth===w&&innerHeight===h,[width,height]);await page.evaluate(()=>scrollTo(0,0));
   if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error(`Horizontal overflow ${language}/${width}`);
   await page.screenshot({path:path.join(root,'artifacts','screenshots',`website-${language}-${width}.png`),fullPage:true});
  }
 }
 await page.getByRole('link',{name:'RU',exact:true}).click();await expect(page.locator('html')).toHaveAttribute('lang','ru');
 await page.getByRole('link',{name:'EN',exact:true}).click();await expect(page.locator('html')).toHaveAttribute('lang','en');
 if(errors.length)throw Error(errors.join('\n'));await fs.writeFile(path.join(root,'artifacts','presentation-results.json'),JSON.stringify({date:new Date().toISOString(),checks:['real editor screenshots','RU/EN navigation','1440/900/390 layout','download URLs','local assets','no page errors'],errors},null,2));console.log('RU/EN product page: desktop/mobile, links and assets passed');
}finally{if(app){await app.evaluate(({app})=>app.exit(0)).catch(()=>{});await app.close().catch(()=>{});}await new Promise(resolve=>server.close(resolve));}
