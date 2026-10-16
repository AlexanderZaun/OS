import type { CanvasRendererFactory } from '../../../../sdk/canvas2d';
import type { FogFrame } from './model';
import { randomSequence } from './model';

// Local surfaces are bounded, independent of scene resolution and released per object.
export const fogRenderer:CanvasRendererFactory={kind:'fog',create(){
  const layer=document.createElement('canvas'),texture=document.createElement('canvas');
  layer.width=layer.height=384;texture.width=texture.height=96;
  const c=layer.getContext('2d',{willReadFrequently:true})!,tc=texture.getContext('2d')!;
  let textureKey='',maskKey='',frameKey='';
  let alphaMask=new Float32Array(384*384);
  return {draw(context,primitive){
    const frame=primitive.data as FogFrame;
    const key=`${frame.seed}:${frame.detail}:${primitive.color}`;
    if(key!==textureKey){
      const random=randomSequence(frame.seed),image=tc.createImageData(96,96);
      const grids=[6,12,24].map(size=>({size,values:Float32Array.from({length:(size+1)**2},random)}));
      const rgb=[1,3,5].map(start=>parseInt(primitive.color.slice(start,start+2),16));
      const smooth=(v:number)=>v*v*(3-2*v);
      for(let y=0;y<96;y++)for(let x=0;x<96;x++){
        const u=(x+.5)/96,v=(y+.5)/96,r=Math.hypot((u-.5)*2,(v-.5)*2);
        let noise=0;
        for(const [index,grid] of grids.entries()){
          const gx=u*grid.size,gy=v*grid.size,ix=Math.floor(gx),iy=Math.floor(gy),fx=smooth(gx-ix),fy=smooth(gy-iy);
          const at=(dx:number,dy:number)=>grid.values[(iy+dy)*(grid.size+1)+ix+dx];
          noise+=((at(0,0)*(1-fx)+at(1,0)*fx)*(1-fy)+(at(0,1)*(1-fx)+at(1,1)*fx)*fy)*[.6,.28,.12][index];
        }
        const i=(y*96+x)*4;image.data[i]=rgb[0];image.data[i+1]=rgb[1];image.data[i+2]=rgb[2];
        image.data[i+3]=255*Math.max(0,1-r*r)**2*((1-frame.detail)*.7+frame.detail*noise);
      }
      tc.putImageData(image,0,0);textureKey=key;
    }
    const nextFrameKey=JSON.stringify(frame)+primitive.color;
    if(nextFrameKey!==frameKey){
    c.clearRect(0,0,384,384);c.globalCompositeOperation='source-over';
    for(const b of frame.billows){
      c.globalAlpha=b.weight;const radius=b.radius*192;
      c.drawImage(texture,192+b.x*192-radius,192+b.y*192-radius,radius*2,radius*2);
    }
    c.globalAlpha=1;
    if(frame.opening>0){
      const radius=frame.opening*192,g=c.createRadialGradient(192,192,0,192,192,radius);
      g.addColorStop(0,'#000');g.addColorStop(.4,'#000c');g.addColorStop(1,'#0000');
      c.globalCompositeOperation='destination-out';c.fillStyle=g;c.fillRect(0,0,384,384);
    }
    // A small analytical alpha mask, rather than a full-scene blur pass.
    const nextMaskKey=`${frame.shape}:${frame.edge}`;
    if(nextMaskKey!==maskKey){
      const exponent=frame.shape==='rounded'?4:2;
      for(let y=0;y<384;y++)for(let x=0;x<384;x++){
        const radius=(Math.abs((x+.5-192)/192)**exponent+Math.abs((y+.5-192)/192)**exponent)**(1/exponent);
        const alpha=Math.max(0,Math.min(1,(1-radius)/frame.edge));
        alphaMask[y*384+x]=alpha*alpha*(3-2*alpha);
      }
      maskKey=nextMaskKey;
    }
    const mask=c.getImageData(0,0,384,384);
    for(let i=0;i<alphaMask.length;i++)mask.data[i*4+3]*=alphaMask[i];
    c.putImageData(mask,0,0);
    frameKey=nextFrameKey;
    }
    context.translate(primitive.x,primitive.y);context.rotate(frame.rotation);
    context.drawImage(layer,-primitive.width/2,-primitive.height/2,primitive.width,primitive.height);
  },dispose(){layer.width=layer.height=texture.width=texture.height=0;alphaMask=new Float32Array(0);textureKey=maskKey=frameKey='';}};
}};
