import type {ObjectTemplate} from '../../../contracts/object-template';
import layers from './layers.json';

// Reuse the example's appearance, but never copy its project-local source IDs.
const variants = [
  {layer:'fog0',id:'cloud-fog',label:{ru:'Туман',en:'Fog'}},
  {layer:'small',id:'cloud-small-stars',label:{ru:'Мелкие звёзды',en:'Small stars'}},
  {layer:'large',id:'cloud-large-stars',label:{ru:'Крупные звёзды',en:'Large stars'}},
  {layer:'network',id:'cloud-network',label:{ru:'Сеть звёзд',en:'Star network'}},
];
export const objectTemplates:ObjectTemplate[] = variants.map(variant => {
  const layer = layers.find(layer => layer.id === variant.layer)!;
  return {id:variant.id,effect:layer.effect,label:variant.label,
    values:Object.fromEntries(Object.entries(layer.values).map(([key,value]) =>
      [key,typeof value === 'string' && value.startsWith('$') ? '' : value]))};
});
