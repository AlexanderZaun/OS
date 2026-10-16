import type { Primitive, RenderBackend } from '../../sdk';
export class CanvasBackend implements RenderBackend {
  private context:CanvasRenderingContext2D;
  constructor(readonly canvas:HTMLCanvasElement) { const c=canvas.getContext('2d'); if(!c)throw Error('Canvas unavailable'); this.context=c; }
  render(primitives:Primitive[]) {
    const c=this.context; c.clearRect(0,0,this.canvas.width,this.canvas.height);
    for(const p of primitives) { c.save(); c.globalAlpha=p.opacity; c.fillStyle=p.color;
      if(p.kind==='rect') c.fillRect(p.x,p.y,p.width,p.height);
      else { c.font=`600 ${p.size??48}px Arial, sans-serif`; c.textAlign='center'; c.textBaseline='middle';
        const lines=(p.text??'').split('\n'); lines.forEach((line,i)=>c.fillText(line,p.x,p.y+(i-(lines.length-1)/2)*(p.size??48)*1.3,p.width)); }
      c.restore();
    }
  }
  dispose(){this.context.clearRect(0,0,this.canvas.width,this.canvas.height);}
}
