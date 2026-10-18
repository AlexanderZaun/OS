import type { Primitive, RenderBackend,RenderLayer } from '../../sdk';
import {defaultLayerStyle} from '../../core/scene/layer-style';
import type { CanvasRendererFactory, CanvasRendererInstance } from '../../sdk/canvas2d';
export class CanvasBackend implements RenderBackend {
  private context:CanvasRenderingContext2D;
  private instances=new Map<string,CanvasRendererInstance>();
  private composition:HTMLCanvasElement|null=null;
  private surfaces:HTMLCanvasElement[]=[];
  constructor(readonly canvas:HTMLCanvasElement,private factories:CanvasRendererFactory[]=[]) { const c=canvas.getContext('2d'); if(!c)throw Error('Canvas unavailable'); this.context=c; }
  private surface(index:number){
    const canvas=this.surfaces[index]??(this.surfaces[index]=document.createElement('canvas'));
    if(canvas.width!==this.canvas.width||canvas.height!==this.canvas.height){canvas.width=this.canvas.width;canvas.height=this.canvas.height;}
    const context=canvas.getContext('2d')!;context.clearRect(0,0,canvas.width,canvas.height);return {canvas,context};
  }
  render(primitives:Primitive[],opacity=1,layers?:RenderLayer[]) {
    const alpha=Number.isFinite(opacity)?Math.max(0,Math.min(1,opacity)):1;
    this.context.clearRect(0,0,this.canvas.width,this.canvas.height);
    let c=this.context;
    if(alpha<1){
      this.composition??=document.createElement('canvas');
      if(this.composition.width!==this.canvas.width||this.composition.height!==this.canvas.height){this.composition.width=this.canvas.width;this.composition.height=this.canvas.height;}
      c=this.composition.getContext('2d')!;c.clearRect(0,0,this.canvas.width,this.canvas.height);
    }else if(this.composition){this.composition.width=this.composition.height=0;this.composition=null;}
    const active=new Set<string>();
    const draw=(c:CanvasRenderingContext2D,items:Primitive[])=>{for(const p of items) { c.save(); try { c.globalAlpha=p.opacity; c.fillStyle=p.color;
      if(p.kind==='rect') c.fillRect(p.x,p.y,p.width,p.height);
      else if(p.kind==='text') { c.font=`600 ${p.size??48}px Arial, sans-serif`; c.textAlign='center'; c.textBaseline='middle';
        const lines=(p.text??'').split('\n'); lines.forEach((line,i)=>c.fillText(line,p.x,p.y+(i-(lines.length-1)/2)*(p.size??48)*1.3,p.width)); }
      else {const factory=this.factories.find(f=>f.kind===p.kind);if(!factory||!p.ownerId)continue;
        const key=`${p.ownerId}:${p.kind}`;active.add(key);let renderer=this.instances.get(key);
        if(!renderer){renderer=factory.create();this.instances.set(key,renderer);}renderer.draw(c,p);}
      } finally {c.restore();}
    }};
    const styled=layers?.some(l=>l.style&&(l.style.blend!=='normal'||l.style.clip||l.style.hue!==0||l.style.saturation!==100||l.style.opacity!==100));
    if(styled&&layers){
      const grouped=new Map<string,Primitive[]>();for(const p of primitives){if(p.ownerId){const items=grouped.get(p.ownerId)??[];items.push(p);grouped.set(p.ownerId,items);}}
      // Three reusable surfaces: raw current layer, processed current layer, previous visible layer alpha.
      let previous:HTMLCanvasElement|null=null;
      for(const layer of layers){
        const style=layer.style??defaultLayerStyle(),raw=this.surface(0),processed=this.surface(1);
        draw(raw.context,grouped.get(layer.id)??[]);
        processed.context.save();processed.context.filter=`hue-rotate(${style.hue}deg) saturate(${style.saturation}%)`;
        processed.context.globalAlpha=style.opacity/100;processed.context.drawImage(raw.canvas,0,0);processed.context.restore();
        if(style.clip){
          if(previous){processed.context.save();processed.context.globalCompositeOperation='destination-in';processed.context.drawImage(previous,0,0);processed.context.restore();}
          else processed.context.clearRect(0,0,this.canvas.width,this.canvas.height);
        }
        c.save();c.globalCompositeOperation=style.blend==='normal'?'source-over':style.blend==='add'?'lighter':style.blend;
        c.drawImage(processed.canvas,0,0);c.restore();
        const mask=this.surface(2);mask.context.drawImage(processed.canvas,0,0);previous=mask.canvas;
      }
    }else{draw(c,primitives);for(const surface of this.surfaces)surface.width=surface.height=0;this.surfaces=[];}
    for(const [key,renderer] of this.instances)if(!active.has(key)){renderer.dispose();this.instances.delete(key);}
    if(alpha<1&&this.composition){this.context.save();this.context.globalAlpha=alpha;this.context.drawImage(this.composition,0,0);this.context.restore();}
  }
  dispose(){for(const renderer of this.instances.values())renderer.dispose();this.instances.clear();for(const surface of this.surfaces)surface.width=surface.height=0;this.surfaces=[];if(this.composition){this.composition.width=this.composition.height=0;this.composition=null;}this.context.clearRect(0,0,this.canvas.width,this.canvas.height);}
}
