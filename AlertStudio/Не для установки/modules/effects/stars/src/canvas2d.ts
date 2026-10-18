import type {CanvasRendererFactory} from '../../../../sdk/canvas2d';
import type {StarsFrame} from './model';

// Six core sprites and one shared glint per field; no per-frame gradients.
export const starsRenderer:CanvasRendererFactory={kind:'stars',create(){
  let key='',sprites:HTMLCanvasElement[]=[];
  let glintSprite:HTMLCanvasElement|undefined;
  function clear(){for(const sprite of sprites)sprite.width=sprite.height=0;sprites=[];key='';if(glintSprite)glintSprite.width=glintSprite.height=0;glintSprite=undefined;}
  return {draw(context,primitive){
    const frame=primitive.data as StarsFrame,nextKey=[primitive.color,frame.glow,frame.palette,frame.shape,frame.haloRadius,frame.coreWhite,frame.coreOpacity,frame.haloColor,frame.haloColorMode].join(':');
    if(key!==nextKey){
      clear();const base=[1,3,5].map(i=>parseInt(primitive.color.slice(i,i+2),16));
      const tint=(target:number[])=>'#'+base.map((c,i)=>Math.round(c*.6+target[i]*.4).toString(16).padStart(2,'0')).join('');
      const colors=frame.palette==='mixed'?[primitive.color,tint([255,196,124]),tint([151,190,255])]:[primitive.color,primitive.color,primitive.color];
      for(let i=0;i<6;i++){
        const sprite=document.createElement('canvas');sprite.width=sprite.height=64;
        const extent=Math.max(frame.haloRadius,frame.shape==='legacy'?4:frame.shape==='spark'?3:frame.shape==='diamond'?1.4:1);
        const c=sprite.getContext('2d')!,color=colors[Math.floor(i/2)],coreRadius=32/extent;
        const halo=frame.haloColorMode==='custom'?frame.haloColor:color;
        if(frame.glow>0){
          const gradient=c.createRadialGradient(32,32,frame.haloRadius===6?2:Math.min(coreRadius*.375,32*frame.haloRadius/extent*.8),32,32,32*frame.haloRadius/extent);gradient.addColorStop(0,halo);gradient.addColorStop(.25,halo+'80');gradient.addColorStop(1,halo+'00');
          c.globalAlpha=frame.glow;c.fillStyle=gradient;c.fillRect(0,0,64,64);c.globalAlpha=1;
        }
        c.fillStyle=color;c.globalAlpha=frame.coreOpacity;
        if(frame.shape==='legacy'&&i%2){const ray=coreRadius*3.75,waist=coreRadius*.5625;c.beginPath();c.moveTo(32,32-ray);c.lineTo(32+waist,32-waist);c.lineTo(32+ray,32);c.lineTo(32+waist,32+waist);c.lineTo(32,32+ray);c.lineTo(32-waist,32+waist);c.lineTo(32-ray,32);c.lineTo(32-waist,32-waist);c.closePath();c.fill();}
        c.beginPath();
        if(frame.shape==='square')c.rect(32-coreRadius,32-coreRadius,coreRadius*2,coreRadius*2);
        else if(frame.shape==='diamond'||frame.shape==='spark'){
          const points=frame.shape==='spark'?8:4;
          for(let j=0;j<points;j++){const a=-Math.PI/2+j*Math.PI*2/points,r=frame.shape==='spark'?(j%2?coreRadius*.4:coreRadius*3):coreRadius*1.4;const x=32+Math.cos(a)*r,y=32+Math.sin(a)*r;j?c.lineTo(x,y):c.moveTo(x,y);}c.closePath();
        }else c.arc(32,32,frame.shape==='legacy'&&frame.haloRadius===6?5.33:coreRadius,0,Math.PI*2);
        c.fill();
        c.fillStyle='#ffffff';c.globalAlpha=frame.coreWhite*frame.coreOpacity;c.beginPath();c.arc(32,32,frame.shape==='legacy'&&frame.haloRadius===6?2.4:coreRadius*.45,0,Math.PI*2);c.fill();
        sprites.push(sprite);
      }key=nextKey;
    }
    const opacity=context.globalAlpha;
    context.translate(primitive.x,primitive.y);context.rotate(frame.rotation);
    if(frame.clip!=='none'){context.beginPath();context.rect(-primitive.width/2,-primitive.height/2,primitive.width,primitive.height);context.clip();}
    for(const star of frame.stars){
      context.globalAlpha=opacity*star.alpha;const radius=star.radius*Math.max(frame.haloRadius,frame.shape==='legacy'?4:frame.shape==='spark'?3:frame.shape==='diamond'?1.4:1);
      if(star.trailX!==undefined&&star.trailY!==undefined){context.strokeStyle=primitive.color;context.lineWidth=.6;context.globalAlpha*=.4;context.beginPath();context.moveTo(star.trailX,star.trailY);context.lineTo(star.x,star.y);context.stroke();context.globalAlpha=opacity*star.alpha;}
      context.drawImage(sprites[star.color*2+Number(star.sparkle)],star.x-radius,star.y-radius,radius*2,radius*2);
      if((star.glint??0)>0){
        if(!glintSprite){
          glintSprite=document.createElement('canvas');glintSprite.width=glintSprite.height=64;
          const c=glintSprite.getContext('2d')!,g=c.createRadialGradient(32,32,0,32,32,32);
          g.addColorStop(0,'#ffffff');g.addColorStop(.15,primitive.color);g.addColorStop(1,primitive.color+'00');c.fillStyle=g;
          c.beginPath();c.moveTo(32,0);c.lineTo(34,30);c.lineTo(64,32);c.lineTo(34,34);c.lineTo(32,64);c.lineTo(30,34);c.lineTo(0,32);c.lineTo(30,30);c.closePath();c.fill();
        }
        const ray=star.radius*frame.glintLength;context.globalAlpha=opacity*star.alpha*star.glint!;
        context.drawImage(glintSprite,star.x-ray,star.y-ray,ray*2,ray*2);
      }
    }
  },dispose:clear};
}};
