import {CanvasBackend} from '../adapters/render-canvas2d';
import {fogRenderer} from '../modules/effects/fog/src/canvas2d';
import {fogEffect} from '../modules/effects/fog/src/model';
export function run(){
  const canvas=document.createElement('canvas');canvas.width=1920;canvas.height=1080;
  let disposed=0;
  const backend=new CanvasBackend(canvas,[{kind:'fog',create(){const renderer=fogRenderer.create();return {draw:renderer.draw,dispose(){disposed++;renderer.dispose();}};}}]);
  const values=Object.fromEntries(fogEffect.settings.map(s=>[s.id,s.default]));
  const frame=(ownerId:string,time:number)=>fogEffect.evaluate(values,time).map(p=>({...p,ownerId}));
  backend.render([...frame('a',0),...frame('b',0)]);backend.render(frame('b',1));
  if(disposed!==1)throw Error('Removed object renderer not disposed');
  const start=performance.now();for(let i=0;i<30;i++)backend.render(frame('b',i/60));
  const frameMilliseconds=(performance.now()-start)/30;
  backend.dispose();return {disposed,frameMilliseconds};
}
