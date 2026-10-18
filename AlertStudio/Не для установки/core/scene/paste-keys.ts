import type {Effect} from '../../sdk';
import type {Value} from '../../contracts/project';
export function pasteKeys(effect:Effect,source:Record<string,Value>,target:Record<string,Value>,links:boolean,coordinates:boolean){
  const omitted=new Set<string>();
  if(!links){
    for(const s of effect.settings)if(s.type==='source'){omitted.add(s.id);if(s.when)for(const c of [s.when,...s.when.and??[]])omitted.add(c.key);}
    for(let i=0;i<effect.settings.length;i++){const count=omitted.size;for(const s of effect.settings)if(omitted.has(s.id)&&s.when)for(const c of [s.when,...s.when.and??[]])omitted.add(c.key);if(count===omitted.size)break;}
  }
  if(!coordinates){
    const combined={...source,...Object.fromEntries([...omitted].map(key=>[key,target[key]??effect.settings.find(s=>s.id===key)?.default??'']))};
    for(const values of [source,target,combined]){
      const position=typeof effect.editor?.position==='function'?effect.editor.position(values):effect.editor?.position;
      for(const key of position?Object.values(position):['x','y'])omitted.add(key);
    }
  }
  return effect.settings.filter(s=>Object.hasOwn(source,s.id)&&!omitted.has(s.id)).map(s=>s.id);
}
