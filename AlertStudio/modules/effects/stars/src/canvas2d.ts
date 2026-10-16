import type {CanvasRendererFactory} from '../../../../sdk/canvas2d';
import type {StarsFrame} from './model';

// Six small reusable sprites per field; no full-scene surfaces or per-frame gradients.
export const starsRenderer:CanvasRendererFactory={kind:'stars',create(){
  let key='',sprites:HTMLCanvasElement[]=[];
  function clear(){for(const sprite of sprites)sprite.width=sprite.height=0;sprites=[];key='';}
  return {draw(context,primitive){
    const frame=primitive.data as StarsFrame,nextKey=`${primitive.color}:${frame.glow}:${frame.palette}`;
    if(key!==nextKey){
      clear();const base=[1,3,5].map(i=>parseInt(primitive.color.slice(i,i+2),16));
      const tint=(target:number[])=>'#'+base.map((c,i)=>Math.round(c*.6+target[i]*.4).toString(16).padStart(2,'0')).join('');
      const colors=frame.palette==='mixed'?[primitive.color,tint([255,196,124]),tint([151,190,255])]:[primitive.color,primitive.color,primitive.color];
      for(let i=0;i<6;i++){
        const sprite=document.createElement('canvas');sprite.width=sprite.height=64;
        const c=sprite.getContext('2d')!,color=colors[Math.floor(i/2)];
        if(frame.glow>0){
          const gradient=c.createRadialGradient(32,32,2,32,32,32);gradient.addColorStop(0,color);gradient.addColorStop(.25,color+'80');gradient.addColorStop(1,color+'00');
          c.globalAlpha=frame.glow;c.fillStyle=gradient;c.fillRect(0,0,64,64);c.globalAlpha=1;
        }
        c.fillStyle=color;
        if(i%2){c.beginPath();c.moveTo(32,12);c.lineTo(35,29);c.lineTo(52,32);c.lineTo(35,35);c.lineTo(32,52);c.lineTo(29,35);c.lineTo(12,32);c.lineTo(29,29);c.closePath();c.fill();}
        c.beginPath();c.arc(32,32,5.33,0,Math.PI*2);c.fill();
        c.fillStyle='#ffffff';c.globalAlpha=.75;c.beginPath();c.arc(32,32,2.4,0,Math.PI*2);c.fill();
        sprites.push(sprite);
      }key=nextKey;
    }
    const opacity=context.globalAlpha;
    context.translate(primitive.x,primitive.y);context.rotate(frame.rotation);
    context.beginPath();context.rect(-primitive.width/2,-primitive.height/2,primitive.width,primitive.height);context.clip();
    for(const star of frame.stars){
      context.globalAlpha=opacity*star.alpha;const radius=star.radius*6;
      context.drawImage(sprites[star.color*2+Number(star.sparkle)],star.x-radius,star.y-radius,radius*2,radius*2);
    }
  },dispose:clear};
}};
