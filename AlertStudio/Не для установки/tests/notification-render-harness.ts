import {CanvasBackend} from '../adapters/render-canvas2d';
export function run(){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=32;
  const backend=new CanvasBackend(canvas),primitives=[{kind:'rect',x:0,y:0,width:32,height:32,color:'#ffffff',opacity:.5},{kind:'rect',x:0,y:0,width:32,height:32,color:'#ffffff',opacity:.5}];
  const alpha=()=>canvas.getContext('2d')!.getImageData(16,16,1,1).data[3];
  backend.render(primitives);const full=alpha();backend.render(primitives,.5);const faded=alpha();
  if(Math.abs(faded-full*.5)>1)throw Error(`Opacity must affect the composition once: ${full}, ${faded}`);
  backend.render(primitives,0);if(alpha()!==0)throw Error('Zero opacity must clear the frame');
  backend.render(primitives);if(alpha()!==full)throw Error('Returning to main must restore exact pixels');
  canvas.width=canvas.height=64;backend.render(primitives,.5);if(alpha()!==faded)throw Error('Opacity surface must follow canvas resize');
  backend.dispose();if(alpha()!==0)throw Error('Disposal must clear the stage frame');
  return {full,faded};
}
