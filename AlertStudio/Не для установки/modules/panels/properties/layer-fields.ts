import {translator} from '../../../locales/platform';
import type {SceneObject} from '../../../contracts/project';
import type {LayerKey} from '../../../contracts/layer';
import {defaultLayerStyle} from '../../../core/scene/layer-style';
import {matchesSettingsText} from '../../../core/scene/settings-tools';
export const layerLabels={blend:'layerBlend',clip:'layerClip',opacity:'layerOpacity',hue:'layerHue',saturation:'layerSaturation'} as const;
export const blendKeys=['blendNormal','blendMultiply','blendScreen','blendOverlay','blendDarken','blendLighten','blendDodge','blendBurn','blendHardLight','blendSoftLight','blendDifference','blendExclusion','blendAdd'] as const;
export function matchingLayerKeys(object:SceneObject,query:string,modifiedOnly:boolean):LayerKey[]{
  const ru=translator('ru'),en=translator('en'),defaults=defaultLayerStyle();
  return (Object.keys(layerLabels) as LayerKey[]).filter(key=>(!modifiedOnly||(object.layer??defaults)[key]!==defaults[key])&&matchesSettingsText(query,key,ru(layerLabels[key]),en(layerLabels[key]),ru('layerAppearance'),en('layerAppearance'),...(key==='blend'?blendKeys.flatMap(k=>[ru(k),en(k)]):[])));
}
