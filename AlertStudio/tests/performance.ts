import { performance } from 'node:perf_hooks';
import os from 'node:os';
import { promises as fs } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { Projects } from '../core/project/service';
import { textEffect } from '../modules/effects/text/src/register';
import { Files } from '../adapters/storage-files/project';
async function run(){
  const scenes=[];
  for(const count of [1,50,200]) {
    const project=new Projects(()=>[textEffect]).snapshot().project;project.modules.text='0.1.0';
    project.objects=Array.from({length:count},(_,i)=>({id:`object-${i}`,type:'text',name:`Text ${i}`,visible:true,settings:Object.fromEntries(textEffect.settings.map(s=>[s.id,s.default]))}));
    const folder=`.test-data/perf-${randomUUID()}`;const files=new Files();let start=performance.now();await files.save(folder,project);const saveMs=performance.now()-start;start=performance.now();await files.open(folder);const openMs=performance.now()-start;
    start=performance.now();for(let frame=0;frame<1000;frame++)for(const o of project.objects)textEffect.evaluate(o.settings,frame/60);const evaluationMsPerFrame=(performance.now()-start)/1000;
    scenes.push({objects:count,files:count*6+6,saveMs,openMs,evaluationMsPerFrame,rssBytes:process.memoryUsage().rss});
  }
  await fs.writeFile('artifacts/performance.json',JSON.stringify({date:new Date().toISOString(),platform:process.platform,node:process.version,cpu:os.cpus()[0].model,totalRam:os.totalmem(),scenes,scope:'single run; CPU evaluation only, not raster frame time or GPU/latency/export'},null,2));console.log(JSON.stringify(scenes));
}
void run();
