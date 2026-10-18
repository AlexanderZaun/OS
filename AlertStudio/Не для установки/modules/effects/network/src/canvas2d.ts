import type {CanvasRendererFactory} from '../../../../sdk/canvas2d';
import type {NetworkFrame} from './model';
export const networkRenderer:CanvasRendererFactory={kind:'network',create(){return {draw(context,primitive){
  const frame=primitive.data as NetworkFrame,opacity=context.globalAlpha;
  context.lineWidth=frame.lineWidth;context.lineCap='round';context.strokeStyle=primitive.color;
  context.setLineDash(frame.dash);context.lineDashOffset=frame.dashOffset;
  for(const edge of frame.edges){
    if(edge.alpha<=0||edge.samples?.every(s=>s.alpha===0))continue;
    const paint=(color:string)=>{
      if(!edge.samples)return color;
      const gradient=context.createLinearGradient(edge.a.x,edge.a.y,edge.b.x,edge.b.y);
      for(const sample of edge.samples)gradient.addColorStop(sample.t,color+Math.round(sample.alpha*255).toString(16).padStart(2,'0'));
      return gradient;
    };
    const foreground=paint(primitive.color);context.strokeStyle=foreground;
    context.beginPath();context.moveTo(edge.a.x,edge.a.y);context.lineTo(edge.b.x,edge.b.y);
    if(frame.outlineWidth>0){context.globalAlpha=opacity*edge.alpha;context.strokeStyle=paint(frame.outlineColor);context.lineWidth=frame.lineWidth+2*frame.outlineWidth;context.stroke();context.strokeStyle=foreground;context.lineWidth=frame.lineWidth;}
    if(frame.glow>0){context.globalAlpha=opacity*edge.alpha*frame.glow;context.shadowColor=primitive.color;context.shadowBlur=frame.glowRadius;context.stroke();context.shadowBlur=0;}
    context.globalAlpha=opacity*edge.alpha;context.stroke();
  }
},dispose(){}};}};
