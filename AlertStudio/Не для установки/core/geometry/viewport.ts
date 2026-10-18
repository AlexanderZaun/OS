export const MIN_SCALE=.01,MAX_SCALE=8;
export interface Camera {scale:number;x:number;y:number;}
export interface FrameBounds {x:number;y:number;width:number;height:number;rotation?:number;}
export function clampScale(value:number){return Number.isFinite(value)?Math.min(MAX_SCALE,Math.max(MIN_SCALE,value)):1;}
export function zoomAt(previous:Camera,scale:number,point={x:0,y:0}):Camera {
  const next=clampScale(scale);return {scale:next,x:point.x-(point.x-previous.x)*next/previous.scale,y:point.y-(point.y-previous.y)*next/previous.scale};
}
export function frameCamera(box:FrameBounds,stage:{width:number;height:number},scene:{width:number;height:number}):Camera|null {
  if(![box.x,box.y,box.width,box.height,box.rotation??0,stage.width,stage.height,scene.width,scene.height].every(Number.isFinite)||box.width<=0||box.height<=0||stage.width<=48||stage.height<=48)return null;
  const c=Math.abs(Math.cos(box.rotation??0)),s=Math.abs(Math.sin(box.rotation??0));
  const scale=clampScale(Math.min((stage.width-48)/(box.width*c+box.height*s),(stage.height-48)/(box.width*s+box.height*c)));
  return {scale,x:(scene.width/2-box.x)*scale,y:(scene.height/2-box.y)*scale};
}
export function parseZoomPercent(text:string):number|null {
  const cleaned=text.trim().replace(/%$/,'').trim().replace(',','.');
  if(!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(cleaned))return null;
  const value=Number(cleaned);return Number.isFinite(value)&&value>0?clampScale(value/100):null;
}
