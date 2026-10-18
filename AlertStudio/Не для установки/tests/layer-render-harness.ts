import {CanvasBackend} from '../adapters/render-canvas2d';
import {defaultLayerStyle} from '../core/scene/layer-style';
import type {Primitive,RenderLayer} from '../sdk';
import {blendModes} from '../contracts/layer';
export function run(){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=32;const backend=new CanvasBackend(canvas);
  const rect=(ownerId:string,color:string,opacity=1,x=0,width=32):Primitive=>({kind:'rect',ownerId,color,opacity,x,y:0,width,height:32});
  const layers:RenderLayer[]=[{id:'base'},{id:'top',style:defaultLayerStyle()}];
  const pixel=(x=16)=>Array.from(canvas.getContext('2d')!.getImageData(x,16,1,1).data);
  const equal=(actual:number[],expected:number[],message:string)=>{if(actual.some((n,i)=>Math.abs(n-expected[i])>2))throw Error(`${message}: ${actual} expected ${expected}`);};
  layers[1].style!.blend='multiply';backend.render([rect('base','#ff0000'),rect('top','#0000ff')],1,layers);equal(pixel(),[0,0,0,255],'Multiply');
  layers[1].style!.blend='screen';backend.render([rect('base','#ff0000'),rect('top','#0000ff')],1,layers);equal(pixel(),[255,0,255,255],'Screen');
  for(const mode of blendModes){layers[1].style!.blend=mode;backend.render([rect('base','#553322'),rect('top','#4488aa')],1,layers);if(pixel()[3]!==255)throw Error(`Blend ${mode} lost alpha`);}
  layers[1].style={...defaultLayerStyle(),clip:true};
  backend.render([rect('base','#ffffff',1,0,8),rect('top','#ff0000')],1,layers);equal(pixel(4),[255,0,0,255],'Inside mask');equal(pixel(),[0,0,0,0],'Outside mask');
  backend.render([rect('top','#ff0000')],1,layers);equal(pixel(),[0,0,0,0],'Empty previous layer');
  backend.render([rect('top','#ff0000')],1,[layers[1]]);equal(pixel(),[0,0,0,0],'No previous layer');
  // A clipped layer becomes the next mask: no accidental reuse of the first layer.
  const chain=[{id:'base'},{id:'top',style:{...defaultLayerStyle(),clip:true}},{id:'last',style:{...defaultLayerStyle(),clip:true}}];
  backend.render([rect('base','#ffffff',1,0,8),rect('top','#ff0000',1,16,8),rect('last','#0000ff')],1,chain);equal(pixel(20),[0,0,0,0],'Clipping chain');
  layers[1].style={...defaultLayerStyle(),saturation:0};backend.render([rect('top','#ff0000')],1,layers);const gray=pixel();if(Math.max(...gray.slice(0,3))-Math.min(...gray.slice(0,3))>1)throw Error('Desaturation');
  layers[1].style={...defaultLayerStyle(),hue:120};backend.render([rect('top','#ff0000')],1,layers);const hue=pixel();if(hue[1]<=hue[0])throw Error('Hue rotation');
  layers[1].style={...defaultLayerStyle(),opacity:50};backend.render([rect('top','#ffffff'),rect('top','#ffffff')],.5,layers);equal(pixel(),[255,255,255,64],'Group layer and stage opacity applied once');
  canvas.width=64;backend.render([rect('top','#ffffff')],1,layers);equal(pixel(),[255,255,255,128],'Resize');
  backend.render([rect('top','#ff0000')],1,[{id:'top'}]);equal(pixel(),[255,0,0,255],'Return to unstyled path');
  backend.dispose();equal(pixel(),[0,0,0,0],'Disposal');return 'Layer pixel checks passed';
}
