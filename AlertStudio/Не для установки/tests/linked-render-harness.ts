import {createCloudNetwork} from '../modules/presets/cloud-network/create';
import {fogEffect} from '../modules/effects/fog/src/model';
import {starsEffect} from '../modules/effects/stars/src/model';
import {networkEffect} from '../modules/effects/network/src/model';
import {fogRenderer} from '../modules/effects/fog/src/canvas2d';
import {starsRenderer} from '../modules/effects/stars/src/canvas2d';
import {networkRenderer} from '../modules/effects/network/src/canvas2d';
import {CanvasBackend} from '../adapters/render-canvas2d';
import {evaluateScene} from '../core/scene/evaluate';
import type {Effect} from '../sdk';
import type {StarField} from '../contracts/fields';
export function run(){
  let id=0;const effects=[fogEffect,starsEffect,networkEffect],project=createCloudNetwork(effects,()=>String(++id),'en');
  const canvas=document.createElement('canvas');canvas.width=1920;canvas.height=1080;
  const backend=new CanvasBackend(canvas,[fogRenderer,starsRenderer,networkRenderer]);
  const evaluate:number[]=[],draw:number[]=[];
  try{
    backend.render(evaluateScene(project,effects,0).primitives);
    for(let i=0;i<30;i++){
      const start=performance.now(),frame=evaluateScene(project,effects,i/60),middle=performance.now();backend.render(frame.primitives);const end=performance.now();evaluate.push(middle-start);draw.push(end-middle);
    }
    const stats=(values:number[])=>({mean:values.reduce((a,b)=>a+b,0)/values.length,max:Math.max(...values)});
    return {evaluate:stats(evaluate),draw:stats(draw),frames:30,scene:'4 fog + 1900 small stars + 70 large stars + triangles',width:1920,height:1080};
  }finally{backend.dispose();}
}
// Exercise actual cached renderers through enable/change/disable and out-of-order seeks.
export function appearanceChecks(){
  let id=0;const effects=[fogEffect,starsEffect,networkEffect],project=createCloudNetwork(effects,()=>String(++id),'en');
  const canvas=document.createElement('canvas');canvas.width=1920;canvas.height=1080;
  // Repeated readback may make Chromium switch rasterization paths mid-test.
  // Fix the readback surface policy before comparing exact pixels; preview stays accelerated.
  canvas.getContext('2d',{willReadFrequently:true});
  const backend=new CanvasBackend(canvas,[fogRenderer,starsRenderer,networkRenderer]);
  const hash=(kind:string,time=6)=>{
    backend.render(evaluateScene(project,effects,time).primitives.filter(p=>p.kind===kind));
    const data=canvas.getContext('2d')!.getImageData(0,0,canvas.width,canvas.height).data;
    let result=2166136261;for(const byte of data)result=Math.imul(result^byte,16777619);return result>>>0;
  };
  try{
    const fog=project.objects[0],large=project.objects.find(o=>o.type==='stars'&&o.settings.count===70)!,network=project.objects.find(o=>o.type==='network')!;
    const fogBase=hash('fog');Object.assign(fog.settings,{textureContrast:220,billowStretch:210,billowAngle:90});const fogStyled=hash('fog');hash('fog',12);const fogReplay=hash('fog');
    Object.assign(fog.settings,{textureContrast:100,billowStretch:100,billowAngle:0});const fogRestored=hash('fog');
    // Freeze motion and twinkle so only glints can change the star image with time.
    for(const object of project.objects)if(object.type==='fog')object.settings.speed=0;else if(object.type==='stars')Object.assign(object.settings,{wander:0,twinkle:0});
    // Warm newly created sprite surfaces before strict readback comparisons.
    hash('stars');const starBase=hash('stars');Object.assign(large.settings,{glintIntensity:100,glintFraction:100,glintLength:10});const starStyled=hash('stars'),starLater=hash('stars',12),starReplay=hash('stars');
    large.settings.glintIntensity=0;const starRestored=hash('stars');
    const lineBase=hash('network');Object.assign(network.settings,{dashLength:12,dashGap:8,dashSpeed:13,outlineWidth:1.2});const lineStyled=hash('network'),lineLater=hash('network',6.3),lineReplay=hash('network');
    Object.assign(network.settings,{dashLength:0,outlineWidth:0});const lineRestored=hash('network');
    return {fog:{base:fogBase,styled:fogStyled,replay:fogReplay,restored:fogRestored},stars:{base:starBase,styled:starStyled,later:starLater,replay:starReplay,restored:starRestored},network:{base:lineBase,styled:lineStyled,later:lineLater,replay:lineReplay,restored:lineRestored}};
  }finally{backend.dispose();}
}
export function densityChecks(){
  let id=0;const effects=[fogEffect,starsEffect,networkEffect],project=createCloudNetwork(effects,()=>String(++id),'en');
  const large=project.objects.find(o=>o.type==='stars'&&o.settings.count===70)!;
  const canvas=document.createElement('canvas');canvas.width=1920;canvas.height=1080;canvas.getContext('2d',{willReadFrequently:true});
  const backend=new CanvasBackend(canvas,[starsRenderer,networkRenderer]);
  const hash=(time=6)=>{backend.render(evaluateScene(project,effects,time).primitives.filter(p=>p.ownerId===large.id||p.kind==='network'));
    const data=canvas.getContext('2d')!.getImageData(0,0,canvas.width,canvas.height).data;let hash=2166136261,visible=0;
    for(let i=0;i<data.length;i++){hash=Math.imul(hash^data[i],16777619);if(i%4===3&&data[i])visible++;}return {hash:hash>>>0,visible};};
  try{
    hash();const contour=hash();Object.assign(large.settings,{cloudDistribution:'density',densityFade:100});const density=hash();hash(12);const replay=hash();
    large.settings.cloudDistribution='contour';const restored=hash();
    Object.assign(large.settings,{cloudDistribution:'density',cloudScale:1,offsetX:950,offsetY:-480});const outside=hash();large.settings.densityFade=0;const loose=hash();
    return {contour,density,replay,restored,outside,loose};
  }finally{backend.dispose();}
}
export function maskChecks(){
  let id=0;const project=createCloudNetwork([fogEffect,starsEffect,networkEffect],()=>String(++id),'en'),large=project.objects.find(o=>o.type==='stars'&&o.settings.count===70)!,network=project.objects.find(o=>o.type==='network')!;
  project.objects=[large,network];
  const data:StarField={rotation:0,clip:'none',stars:[-65,65].map((x,id)=>({id,x,y:0,alpha:1,radius:1,color:0,sparkle:false})),cloud:{offsetX:0,offsetY:0,width:200,height:200,field:{rotation:0,shape:'ellipse',edge:.05,opening:.4,billows:[{x:-.65,y:0,radius:.4,weight:1},{x:.65,y:0,radius:.4,weight:1}]}}};
  const fake:Effect={...starsEffect,evaluate:()=>[{kind:'stars',x:200,y:100,width:200,height:200,color:'#ffffff',opacity:1,data}]};
  Object.assign(network.settings,{distance:200,neighbors:1,mode:'segments',width:4,opacity:100,glow:0,outlineWidth:0,cloudMask:'none',maskStep:5,maskStrength:100});
  const canvas=document.createElement('canvas');canvas.width=400;canvas.height=200;const context=canvas.getContext('2d',{willReadFrequently:true})!;
  const backend=new CanvasBackend(canvas,[networkRenderer]);
  const render=(time=6)=>{
    backend.render(evaluateScene(project,[fake,networkEffect],time).primitives.filter(p=>p.kind==='network'));
    const pixels=context.getImageData(0,0,400,200).data;let hash=2166136261;for(const b of pixels)hash=Math.imul(hash^b,16777619);
    return {hash:hash>>>0,center:pixels[(100*400+200)*4+3],end:pixels[(100*400+137)*4+3]};
  };
  try{
    render();const solid=render();network.settings.cloudMask='density';const masked=render();
    Object.assign(network.settings,{outlineWidth:2,glow:80,glowRadius:5});const decorated=render();
    Object.assign(network.settings,{dashLength:12,dashGap:8,dashSpeed:13});const dashed=render(),later=render(12),replay=render();
    Object.assign(network.settings,{dashLength:0,outlineWidth:0,glow:0,maskStrength:0});const disabled=render();
    return {solid,masked,decorated,dashed,later,replay,disabled};
  }finally{backend.dispose();}
}
