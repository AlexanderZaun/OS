import {useEffect,useState} from 'react';
import type {PanelProps} from '../../../sdk/ui';
import {Dialog} from '../../../ui-kit/Dialog';
import {translator} from '../../../locales/platform';
import {objectTemplates} from '../../presets/cloud-network/object-templates';
import {catalogItems,catalogGroup,parseCatalogGroups,catalogStorageKey,type CatalogGroups,type CatalogGroup} from './model';
const changeEvent='alert-studio-catalog-changed';
function readGroups(){try{return parseCatalogGroups(localStorage.getItem(catalogStorageKey));}catch{return {};}}
export function ObjectCatalog({effects,language,dispatch,interactionPending}:PanelProps){
  const [groups,setGroups]=useState<CatalogGroups>(readGroups),[editing,setEditing]=useState(false);
  const items=catalogItems(effects,objectTemplates),t=translator(language);
  useEffect(()=>{if(interactionPending)setEditing(false);},[interactionPending]);
  useEffect(()=>{
    const refresh=()=>setGroups(readGroups());
    const storage=(event:StorageEvent)=>{if(event.key===catalogStorageKey||event.key===null)refresh();};
    window.addEventListener('storage',storage);window.addEventListener(changeEvent,refresh);
    return()=>{window.removeEventListener('storage',storage);window.removeEventListener(changeEvent,refresh);};
  },[]);
  function update(next:CatalogGroups){
    setGroups(next);
    try{localStorage.setItem(catalogStorageKey,JSON.stringify(next));window.dispatchEvent(new Event(changeEvent));}catch{}
  }
  return <>
    <div className="catalog-heading"><button className="quiet-button" aria-label={t('organizeObjects')} title={t('organizeObjects')} onClick={()=>setEditing(true)}><span aria-hidden="true">⇅</span> {t('catalogSections')}</button></div>
    {(['independent','linked'] as const).map(group=><section className="catalog-section" data-category={group} aria-label={t(group==='independent'?'independentObjects':'linkedObjects')} key={group}>
      <h2 title={t(group==='independent'?'independentObjects':'linkedObjects')}>{t(group==='independent'?'independentObjects':'linkedObjects')}</h2>
      <p>{t(items.some(item=>catalogGroup(item,groups)===group&&item.requiresSource!==(group==='linked'))?'customObjectSectionHint':group==='independent'?'independentObjectsHint':'linkedObjectsHint')}</p>
      {items.filter(item=>catalogGroup(item,groups)===group).map(item=><button key={item.id} disabled={interactionPending} aria-label={`${item.label[language]} +`}
        title={`${item.label[language]}${item.requiresSource?' · '+t('objectNeedsSource'):''}`}
        onClick={()=>dispatch({type:'add',effect:item.effect,...(item.template?{template:item.template}:{})})}><span className="catalog-item-line"><span className="catalog-item-name">{item.label[language]}</span><span className="catalog-item-add" aria-hidden="true">+</span></span>
        {item.requiresSource!==(group==='linked')&&<small>{t(item.requiresSource?'objectSourceNeeded':'objectSourceOptional')}</small>}
      </button>)}
      {!items.some(item=>catalogGroup(item,groups)===group)&&<p className="caption">{t('emptyObjectSection')}</p>}
    </section>)}
    {editing&&<Dialog title={t('organizeObjects')} closeLabel={t('close')} onClose={()=>setEditing(false)}>
      <p>{t('organizeObjectsHint')}</p>
      <div className="catalog-assignments">{items.map(item=><label key={item.id}>
        <span>{item.label[language]}</span>
        <select aria-label={`${t('objectSection')}: ${item.label[language]}`} value={catalogGroup(item,groups)}
          onChange={event=>update({...groups,[item.id]:event.target.value as CatalogGroup})}>
          <option value="independent">{t('independentObjects')}</option><option value="linked">{t('linkedObjects')}</option>
        </select>
      </label>)}</div>
      <button onClick={()=>update({})}>{t('resetObjectSections')}</button>
    </Dialog>}
  </>;
}
