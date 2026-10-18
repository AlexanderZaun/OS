import {blendModes,type LayerStyle,type LayerKey} from '../../contracts/layer';
import type {Value} from '../../contracts/project';
export const layerKeys:LayerKey[]=['blend','clip','hue','saturation','opacity'];
export function defaultLayerStyle():LayerStyle{return {version:1,blend:'normal',clip:false,hue:0,saturation:100,opacity:100};}
export function validLayerValue(key:LayerKey,value:Value):boolean{
  if(key==='blend')return blendModes.includes(value as LayerStyle['blend']);
  if(key==='clip')return typeof value==='boolean';
  const ranges={hue:[-180,180],saturation:[0,200],opacity:[0,100]};
  const range=ranges[key];return !!range&&typeof value==='number'&&Number.isInteger(value)&&value>=range[0]&&value<=range[1];
}
