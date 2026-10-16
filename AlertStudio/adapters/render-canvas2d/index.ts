import type { Primitive, RenderBackend } from '../../sdk';
import type { CanvasRendererFactory, CanvasRendererInstance } from '../../sdk/canvas2d';
export class CanvasBackend implements RenderBackend {
  private context:CanvasRenderingContext2D;
  private instances=new Map<string,CanvasRendererInstance>();
  constructor(readonly canvas:HTMLCanvasElement,private factories:CanvasRendererFactory[]=[]) { const c=canvas.getContext('2d'); if(!c)throw Error('Canvas unavailable'); this.context=c; }
  render(primitives:Primitive[]) {
    const c=this.context,active=new Set<string>(); c.clearRect(0,0,this.canvas.width,this.canvas.height);
    for(const p of primitives) { c.save(); try { c.globalAlpha=p.opacity; c.fillStyle=p.color;
      if(p.kind==='rect') c.fillRect(p.x,p.y,p.width,p.height);
      else if(p.kind==='text') { c.font=`600 ${p.size??48}px Arial, sans-serif`; c.textAlign='center'; c.textBaseline='middle';
        const lines=(p.text??'').split('\n'); lines.forEach((line,i)=>c.fillText(line,p.x,p.y+(i-(lines.length-1)/2)*(p.size??48)*1.3,p.width)); }
      else {const factory=this.factories.find(f=>f.kind===p.kind);if(!factory||!p.ownerId)continue;
        const key=`${p.ownerId}:${p.kind}`;active.add(key);let renderer=this.instances.get(key);
        if(!renderer){renderer=factory.create();this.instances.set(key,renderer);}renderer.draw(c,p);}
      } finally {c.restore();}
    }
    for(const [key,renderer] of this.instances)if(!active.has(key)){renderer.dispose();this.instances.delete(key);}
  }
  dispose(){for(const renderer of this.instances.values())renderer.dispose();this.instances.clear();this.context.clearRect(0,0,this.canvas.width,this.canvas.height);}
}
