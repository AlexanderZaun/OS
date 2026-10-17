import type { CanvasRendererFactory } from '../../../../sdk/canvas2d';
import type { FogFrame } from './model';
import { randomSequence } from './model';
import {cloudRadius} from '../../../../core/geometry/cloud';

// Local surfaces are bounded, independent of scene resolution and released per object.
export const fogRenderer:CanvasRendererFactory={kind:'fog',create(){
  const layer=document.createElement('canvas'),texture=document.createElement('canvas');
  layer.width=layer.height=384;texture.width=texture.height=96;
  const c=layer.getContext('2d',{willReadFrequently:true})!,tc=texture.getContext('2d')!;
  let textureKey='',maskKey='',frameKey='';
  let alphaMask=new Float32Array(384*384);
  return {draw(context,primitive){
    const frame=primitive.data as FogFrame;
    const resolution=frame.quality==='high'?768:frame.quality==='draft'?256:384;
    if(layer.width!==resolution){layer.width=layer.height=resolution;alphaMask=new Float32Array(resolution*resolution);maskKey=frameKey='';}
    const half=resolution/2;
    const textureSize=frame.quality==='high'?192:frame.quality==='draft'?64:96;
    if(texture.width!==textureSize){texture.width=texture.height=textureSize;textureKey='';}
    const key=`${frame.seed}:${frame.detail}:${primitive.color}:${frame.brightness}:${frame.textureContrast}:${textureSize}`;
    if(key!==textureKey){
      const random=randomSequence(frame.seed),image=tc.createImageData(textureSize,textureSize);
      const grids=[6,12,24].map(size=>({size,values:Float32Array.from({length:(size+1)**2},random)}));
      const rgb=[1,3,5].map(start=>parseInt(primitive.color.slice(start,start+2),16));
      const smooth=(v:number)=>v*v*(3-2*v);
      for(let y=0;y<textureSize;y++)for(let x=0;x<textureSize;x++){
        const u=(x+.5)/textureSize,v=(y+.5)/textureSize,r=Math.hypot((u-.5)*2,(v-.5)*2);
        let noise=0;
        for(const [index,grid] of grids.entries()){
          const gx=u*grid.size,gy=v*grid.size,ix=Math.floor(gx),iy=Math.floor(gy),fx=smooth(gx-ix),fy=smooth(gy-iy);
          const at=(dx:number,dy:number)=>grid.values[(iy+dy)*(grid.size+1)+ix+dx];
          noise+=((at(0,0)*(1-fx)+at(1,0)*fx)*(1-fy)+(at(0,1)*(1-fx)+at(1,1)*fx)*fy)*[.6,.28,.12][index];
        }
        const i=(y*textureSize+x)*4;image.data[i]=rgb[0]*frame.brightness;image.data[i+1]=rgb[1]*frame.brightness;image.data[i+2]=rgb[2]*frame.brightness;
        const contrasted=frame.textureContrast===1?noise:Math.max(0,Math.min(1,.5+(noise-.5)*frame.textureContrast));
        image.data[i+3]=255*Math.max(0,1-r*r)**2*((1-frame.detail)*.7+frame.detail*contrasted);
      }
      tc.putImageData(image,0,0);textureKey=key;
    }
    const nextFrameKey=JSON.stringify(frame)+primitive.color;
    if(nextFrameKey!==frameKey){
    c.clearRect(0,0,resolution,resolution);c.globalCompositeOperation='source-over';
    for(const b of frame.billows){
      c.globalAlpha=b.weight;const radius=b.radius*half;
      if(frame.billowStretch===1)c.drawImage(texture,half+b.x*half-radius,half+b.y*half-radius,radius*2,radius*2);
      else{
        c.save();c.translate(half+b.x*half,half+b.y*half);
        c.rotate(Math.atan2(b.baseY,b.baseX)+frame.billowAngle);
        c.scale(frame.billowStretch,1/frame.billowStretch);
        c.drawImage(texture,-radius,-radius,radius*2,radius*2);c.restore();
      }
    }
    c.globalAlpha=1;
    if(frame.opening>0){
      c.save();c.translate(half,half);c.scale(frame.openingWidth,frame.openingHeight);c.translate(-half,-half);
      const radius=frame.opening*half,g=c.createRadialGradient(half,half,0,half,half,radius);
      g.addColorStop(0,'#000');g.addColorStop(.4,'#000c');g.addColorStop(1,'#0000');
      c.globalCompositeOperation='destination-out';c.fillStyle=g;c.fillRect(0,0,resolution,resolution);c.restore();
    }
    // A small analytical alpha mask, rather than a full-scene blur pass.
    const nextMaskKey=`${frame.shape}:${frame.edge}:${frame.roughness}:${resolution}`;
    if(nextMaskKey!==maskKey){
      const exponent=frame.shape==='rounded'?4:2;
      for(let y=0;y<resolution;y++)for(let x=0;x<resolution;x++){
        const qx=(x+.5-half)/half,qy=(y+.5-half)/half;
        const radius=frame.shape==='cloud'?Math.hypot(qx,qy)/cloudRadius(frame.shape,Math.atan2(qy,qx),frame.roughness):(Math.abs(qx)**exponent+Math.abs(qy)**exponent)**(1/exponent);
        const alpha=Math.max(0,Math.min(1,(1-radius)/frame.edge));
        alphaMask[y*resolution+x]=alpha*alpha*(3-2*alpha);
      }
      maskKey=nextMaskKey;
    }
    const mask=c.getImageData(0,0,resolution,resolution);
    for(let i=0;i<alphaMask.length;i++)mask.data[i*4+3]*=alphaMask[i];
    c.putImageData(mask,0,0);
    frameKey=nextFrameKey;
    }
    context.translate(primitive.x,primitive.y);context.rotate(frame.rotation);
    context.drawImage(layer,-primitive.width/2,-primitive.height/2,primitive.width,primitive.height);
  },dispose(){layer.width=layer.height=texture.width=texture.height=0;alphaMask=new Float32Array(0);textureKey=maskKey=frameKey='';}};
}};
