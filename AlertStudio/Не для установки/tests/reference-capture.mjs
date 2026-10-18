import {_electron as electron} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const env={...process.env,ALERT_STUDIO_DATA:path.resolve('.test-data/reference')};delete env.ELECTRON_RUN_AS_NODE;
await mkdir('reference/baselines',{recursive:true});
const app=await electron.launch({args:['.','--safe'],env});
try {
  const page=await app.firstWindow();await page.goto(pathToFileURL(path.resolve('reference/original/smoke-configured.html')).href);
  await page.waitForFunction(()=>typeof window.showDonation==='function');
  const conditions=[];
  for(const time of [0,6,12]) {
    const metadata=await page.evaluate(t=>{
      playing=false;cancelAnimationFrame(raf);stopped=false;last=null;resetScatter();
      // Replay stateful effects at fixed 60Hz, rather than seeking without history.
      phaseSeconds=0;render();for(let frame=1;frame<=t*60;frame++){phaseSeconds=frame/60;render();}
      return {time:phaseSeconds,seed:cfg.seed,width:canvas.width,height:canvas.height,background:cfg.backgroundColor,config:structuredClone(cfg)};
    },time);
    const png=await page.locator('#scene').evaluate(c=>c.toDataURL('image/png').split(',')[1]);
    await writeFile(`reference/baselines/t${time}.png`,Buffer.from(png,'base64'));conditions.push(metadata);
  }
  await writeFile('reference/baselines/conditions.json',JSON.stringify({backend:'Canvas2D',replayFps:60,platform:process.platform,conditions},null,2));
  console.log('Reference captured at t=0,6,12 with 60Hz history replay');
}finally{await app.evaluate(({app})=>app.exit(0));await app.close().catch(()=>{});}
