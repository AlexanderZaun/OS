import {_electron as electron} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const env={...process.env,ALERT_STUDIO_DATA:path.resolve('.test-data/reference-focused')};delete env.ELECTRON_RUN_AS_NODE;
await mkdir('artifacts/focused-reference',{recursive:true});
const app=await electron.launch({args:['.','--safe'],env});
try{
  const page=await app.firstWindow();await page.goto(pathToFileURL(path.resolve('reference/original/smoke-configured.html')).href);
  await page.waitForFunction(()=>typeof window.showDonation==='function');
  await page.evaluate(()=>{playing=false;cancelAnimationFrame(raf);for(const id of ['edge','flow','flying','text','darkBase'])cfg[id].enabled=false;});
  const conditions=[];
  for(const time of [0,6,12]){
    conditions.push(await page.evaluate(t=>{playing=false;cancelAnimationFrame(raf);stopped=false;last=null;resetScatter();phaseSeconds=0;render();for(let frame=1;frame<=t*60;frame++){phaseSeconds=frame/60;render();}return {time:phaseSeconds,width:canvas.width,height:canvas.height,config:structuredClone(cfg)};},time));
    const png=await page.locator('#scene').evaluate(c=>c.toDataURL('image/png').split(',')[1]);await writeFile(`artifacts/focused-reference/t${time}.png`,Buffer.from(png,'base64'));
  }
  await writeFile('artifacts/focused-reference/conditions.json',JSON.stringify({backend:'Canvas2D',replayFps:60,excluded:['edge','flow','flying','text','darkBase'],conditions},null,2));
  console.log('Focused reference captured without changing original files');
}finally{await app.evaluate(({app})=>app.exit(0));await app.close().catch(()=>{});}
