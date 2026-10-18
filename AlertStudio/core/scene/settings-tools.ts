import type {Effect,Setting} from '../../sdk';
import type {SceneObject} from '../../contracts/project';
export function matchesSettingsText(query:string,...texts:string[]){
  const normalize=(text:string)=>text.normalize('NFKC').toLocaleLowerCase().replace(/ё/g,'е');
  const terms=normalize(query).trim().split(/\s+/).filter(Boolean),haystack=normalize(texts.join(' '));
  return terms.every(term=>haystack.includes(term));
}
export function settingChanged(object:SceneObject,setting:Setting){return (object.settings[setting.id]??setting.default)!==setting.default;}
export function settingActive(object:SceneObject,effect:Effect,setting:Setting){return !setting.when||[setting.when,...setting.when.and??[]].every(c=>(object.settings[c.key]??effect.settings.find(s=>s.id===c.key)?.default)===c.equals);}
export function searchSettings(object:SceneObject,effect:Effect,query:string,modifiedOnly:boolean){
  const searching=!!query.trim()||modifiedOnly;
  const matches=effect.settings.filter(s=>(!modifiedOnly||settingChanged(object,s))&&matchesSettingsText(query,s.id,s.label.ru,s.label.en,s.group?.label.ru??'',s.group?.label.en??'',...s.options?.flatMap(o=>[o.label.ru,o.label.en,String(o.value)])??[])&&(searching||settingActive(object,effect,s)));
  const context=new Set(matches.flatMap(s=>s.when?[s.when,...s.when.and??[]].map(c=>c.key):[]));
  for(let i=0;i<effect.settings.length;i++){const before=context.size;for(const s of effect.settings)if(context.has(s.id)&&s.when)for(const c of [s.when,...s.when.and??[]])context.add(c.key);if(before===context.size)break;}
  return {matches,settings:effect.settings.filter(s=>matches.includes(s)||(searching&&context.has(s.id)))};
}
