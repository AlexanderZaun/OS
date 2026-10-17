import type {Effect} from '../../../sdk';
import type {Project,Value} from '../../../contracts/project';
import layers from './layers.json';
export function createCloudNetwork(effects:Effect[],id:()=>string,language:'ru'|'en'):Project{
  const ids=new Map(layers.map(layer=>[layer.id,id()]));
  const modules:Record<string,string>={};
  const objects=layers.map(layer=>{
    const effect=effects.find(e=>e.id===layer.effect);if(!effect)throw Error('Missing preset effect');modules[effect.id]=effect.version;
    const settings:Record<string,Value>=Object.fromEntries(effect.settings.map(s=>[s.id,s.default]));
    for(const [key,raw] of Object.entries(layer.values)){
      if(!effect.settings.some(s=>s.id===key))throw Error(`Unknown preset setting ${key}`);
      const value=typeof raw==='string'&&raw.startsWith('$')?ids.get(raw.slice(1)):raw;
      if(value===undefined)throw Error('Missing preset source');settings[key]=value;
    }
    return {id:ids.get(layer.id)!,type:effect.id,name:layer.name[language],visible:true,settings};
  });
  return {id:id(),name:language==='ru'?'Облако, звёзды и сеть':'Cloud, stars and network',format:1,width:1920,height:1080,background:'#101827',modules,objects};
}
