import type {Effect} from '../../../sdk';
import type {ObjectTemplate} from '../../../contracts/object-template';
export type CatalogGroup='independent'|'linked';
export type CatalogGroups=Record<string,CatalogGroup>;
export interface CatalogItem {id:string;effect:string;template?:string;label:{ru:string;en:string};requiresSource:boolean;}
export const catalogStorageKey='alert-studio-object-groups';
export function catalogItems(effects:Effect[],templates:ObjectTemplate[]):CatalogItem[]{
  return effects.flatMap(effect=>{
    const variants=templates.filter(template=>template.effect===effect.id);
    return (variants.length?variants:[undefined]).map(template=>{
      const values={...Object.fromEntries(effect.settings.map(setting=>[setting.id,setting.default])),...template?.values};
      const requiresSource=effect.settings.some(setting=>setting.type==='source'&&(!setting.when||
        [setting.when,...setting.when.and??[]].every(condition=>values[condition.key]===condition.equals)));
      return {id:template?`template:${template.id}`:`effect:${effect.id}`,effect:effect.id,template:template?.id,label:template?.label??effect.label,requiresSource};
    });
  });
}
export function parseCatalogGroups(raw:string|null):CatalogGroups{
  try{
    const value:unknown=JSON.parse(raw??'{}');
    if(!value||typeof value!=='object'||Array.isArray(value))return {};
    return Object.fromEntries(Object.entries(value).filter(([id,group])=>/^(effect|template):[a-zA-Z0-9-]{1,80}$/.test(id)&&(group==='independent'||group==='linked')));
  }catch{return {};}
}
export function catalogGroup(item:CatalogItem,groups:CatalogGroups):CatalogGroup{return groups[item.id]??(item.requiresSource?'linked':'independent');}
