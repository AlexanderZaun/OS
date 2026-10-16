import {CanvasBackend} from '../adapters/render-canvas2d';
import {starsRenderer} from '../modules/effects/stars/src/canvas2d';
import {starsEffect} from '../modules/effects/stars/src/model';
export function run(){
  const canvas=document.createElement('canvas');canvas.width=1920;canvas.height=1080;
  const created:HTMLCanvasElement[]=[],original=document.createElement.bind(document);
  // Observe real sprite lifetimes, including texture invalidation and object removal.
  document.createElement=((tag:string,...args:any[])=>{const element=original(tag,...args);if(tag==='canvas')created.push(element as HTMLCanvasElement);return element;}) as typeof document.createElement;
  const backend=new CanvasBackend(canvas,[starsRenderer]);
  const values=Object.fromEntries(starsEffect.settings.map(s=>[s.id,s.default]));
  const frames=(count:number,time:number,color='#c6ddff')=>starsEffect.evaluate({...values,count,color},time).map(p=>({...p,ownerId:'stars'}));
  const timings:Record<string,number>={};
  try{
    backend.render(frames(220,0));if(created.length!==6)throw Error('Sprite cache size incorrect');
    backend.render(frames(220,1));if(created.length!==6)throw Error('Sprites regenerated during playback');
    backend.render(frames(220,1,'#ff8844'));if(created.slice(0,6).some(c=>c.width!==0))throw Error('Old sprites retained');
    for(const count of [1000,5000]){
      const start=performance.now();for(let i=0;i<20;i++)backend.render(frames(count,i/60,'#ff8844'));
      timings[count]=(performance.now()-start)/20;
    }
    backend.render([]);if(created.some(c=>c.width!==0||c.height!==0))throw Error('Removed renderer retained sprites');
    return {timings,spritesCreated:created.length,spritesReleased:created.filter(c=>c.width===0).length};
  }finally{backend.dispose();document.createElement=original as typeof document.createElement;}
}
