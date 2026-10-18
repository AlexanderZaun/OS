export interface MaskPoint {x:number;y:number;}
export interface MaskSample {t:number;alpha:number;}
export const MAX_MASK_SAMPLES=24000;
export function lineMask(a:MaskPoint,b:MaskPoint,sample:(x:number,y:number)=>number,step:number,strength:number,threshold:number,budget=32){
  const requested=Math.max(2,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/step)+1),count=Math.max(2,Math.min(32,budget,requested));
  const samples:MaskSample[]=Array.from({length:count},(_,i)=>{
    const t=i/(count-1),value=Math.max(0,Math.min(1,sample(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t)/threshold));
    return {t,alpha:1-strength+strength*value*value*(3-2*value)};
  });
  return {samples,limited:count<requested};
}
