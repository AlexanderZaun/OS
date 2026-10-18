import {useEffect,useId,useRef,useState} from 'react';
import type { PanelProps, UiHost } from '../../../sdk/ui';
import type {SceneObject} from '../../../contracts/project';
import { translator } from '../../../locales/platform';
import type {Setting} from '../../../sdk';
import {LayerProperties} from './LayerProperties';
import {SettingHeading} from './SettingHeading';
import {matchingLayerKeys} from './layer-fields';
import {searchSettings,settingActive,settingChanged} from '../../../core/scene/settings-tools';
import {Dialog} from '../../../ui-kit/Dialog';
import {PasteSettings} from './PasteSettings';

export function PropertiesPanel(props:PanelProps){
  const object=props.snapshot.project.objects.find(o=>o.id===props.snapshot.selected),t=translator(props.language);
  return object?<ObjectProperties key={`${props.snapshot.project.id}:${object.id}`} {...props} object={object}/>:<div className="panel-body"><h2>{t('scene')}</h2><p>{props.snapshot.project.width} × {props.snapshot.project.height}</p><p>{t('empty')}</p></div>;
}
function ObjectProperties({snapshot,dispatch,language,effects,interactionPending,object}:PanelProps&{object:SceneObject}){
  const t=translator(language),prefix=useId(),[query,setQuery]=useState(''),[modifiedOnly,setModifiedOnly]=useState(false),[resetRevision,setResetRevision]=useState<number|null>(null);
  const [toolsOpen,setToolsOpen]=useState(false),searchInput=useRef<HTMLInputElement>(null);
  const [pasting,setPasting]=useState(false);
  useEffect(()=>{if(toolsOpen)searchInput.current?.focus();},[toolsOpen]);
  const editingDisabled=interactionPending||object.editor?.locked;
  const effect=effects.find(e=>e.id===object.type&&e.version===snapshot.project.modules[object.type]);
  const found=effect?searchSettings(object,effect,query,modifiedOnly):{matches:[],settings:[]};
  const settings=found.settings,sources=effect?.settings.filter(s=>s.type==='source')??[];
  const linkKeys=new Set(sources.flatMap(s=>[s.id,...(s.when?[s.when,...s.when.and??[]].map(c=>c.key):[])]));
  const links=settings.filter(s=>linkKeys.has(s.id)).sort((a,b)=>Number(b.type==='source')-Number(a.type==='source'));
  const properties=settings.filter(s=>!linkKeys.has(s.id)),groups=[...new Set(properties.map(s=>s.group?.id??'base'))];
  const changedCount=effect?.settings.filter(s=>settingChanged(object,s)).length??0,layerCount=matchingLayerKeys(object,'',true).length;
  const layerMatches=matchingLayerKeys(object,query,modifiedOnly),searching=!!query.trim()||modifiedOnly;
  useEffect(()=>{if(interactionPending||object.editor?.locked||(resetRevision!==null&&resetRevision!==snapshot.revision))setResetRevision(null);},[interactionPending,object.editor?.locked,snapshot.revision]);
  function reset(scope:'effect'|'layer',key:string|null,revision=snapshot.revision){setResetRevision(null);dispatch({type:'settings-reset',id:object.id,scope,key,revision});}
  const renderSetting=(setting:Setting)=>{
    const active=!!effect&&settingActive(object,effect,setting),changed=settingChanged(object,setting),id=`${prefix}-${setting.id}`,disabled=editingDisabled||!active;
    const conditions=setting.when?[setting.when,...setting.when.and??[]]:[];
    return <div key={setting.id} className="setting-field" data-setting={setting.id} data-modified={changed||undefined}>
      <SettingHeading id={id} label={setting.label[language]} unit={setting.unit} changed={changed} baseline={setting.default} disabled={editingDisabled} reset={()=>reset('effect',setting.id)} language={language}/>
      {!active&&<p className="setting-condition">{t('settingAvailableWhen')}: {conditions.map(c=>{const controller=effect?.settings.find(s=>s.id===c.key);return `${controller?.label[language]??c.key} = ${controller?.options?.find(o=>o.value===c.equals)?.label[language]??String(c.equals)}`;}).join(' · ')}</p>}
      {setting.type==='source'?<>
        <select id={id} aria-label={setting.label[language]} disabled={disabled} value={String(object.settings[setting.id]??setting.default)} onChange={e=>dispatch({type:'set',id:object.id,key:setting.id,value:e.target.value})}>
          <option value="">{t('noSource')}</option>
          {snapshot.project.objects.filter(o=>o.type===setting.sourceType&&o.id!==object.id).map(o=><option key={o.id} value={o.id}>{o.name} · {o.id.slice(0,8)}</option>)}
          {!!object.settings[setting.id]&&!snapshot.project.objects.some(o=>o.id===object.settings[setting.id]&&o.type===setting.sourceType)&&<option value={String(object.settings[setting.id])}>{t('missingSource')}</option>}
        </select>
        {!!object.settings[setting.id]&&snapshot.project.objects.some(o=>o.id===object.settings[setting.id])&&<button disabled={interactionPending} onClick={()=>dispatch({type:'select',id:String(object.settings[setting.id])})}>{t('selectSource')}</button>}
      </>:setting.type==='select'?<select id={id} aria-label={setting.label[language]} disabled={disabled} value={String(object.settings[setting.id]??setting.default)} onChange={e=>dispatch({type:'set',id:object.id,key:setting.id,value:setting.options!.find(o=>String(o.value)===e.target.value)!.value})}>
        {setting.options?.map(o=><option key={String(o.value)} value={String(o.value)}>{o.label[language]}</option>)}
      </select>:<input id={id} aria-label={setting.label[language]} disabled={disabled} type={setting.type==='number'?'number':setting.type==='color'?'color':'text'} value={String(object.settings[setting.id]??setting.default)} min={setting.min} max={setting.max} step={setting.type==='number'?setting.step??'any':undefined} onChange={e=>{if(setting.type==='number'&&e.target.value==='')return;dispatch({type:'set',id:object.id,key:setting.id,value:setting.type==='number'?Number(e.target.value):e.target.value});}}/>}
    </div>;
  };
  return <div className="panel-body properties-panel">
    <div className="properties-title"><h2 title={object.name}>{object.name}</h2><button aria-label={t('settingsSearch')} title={t('settingsToolsHint')} aria-expanded={toolsOpen} onClick={()=>{setToolsOpen(!toolsOpen);if(toolsOpen){setQuery('');setModifiedOnly(false);}}}>⌕</button></div>
    {toolsOpen&&<div className="properties-tools">
      <input ref={searchInput} type="search" aria-label={t('settingsSearch')} placeholder={t('settingsSearch')} value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();setQuery('');}}}/>
      <div className="properties-tool-actions"><button aria-label={`${t('modifiedSettings')}: ${changedCount+layerCount}`} aria-pressed={modifiedOnly} title={t('settingChanged')} onClick={()=>setModifiedOnly(!modifiedOnly)}>{t('modifiedSettingsShort')}: {changedCount+layerCount}</button><button disabled={editingDisabled||changedCount+layerCount===0} onClick={()=>setResetRevision(snapshot.revision)}>{t('resetSettings')}</button></div>
      <div className="properties-tool-actions"><button disabled={interactionPending} onClick={()=>dispatch({type:'settings-copy',id:object.id})}>{t('copySettings')}</button><button disabled={editingDisabled||!snapshot.clipboard} onClick={()=>setPasting(true)}>{t('pasteSettings')}</button></div>
    </div>}
    {object.editor?.locked&&<div className="layer-locked-notice"><p>{t('layerLocked')}</p><button disabled={interactionPending} onClick={()=>dispatch({type:'editor',id:object.id,key:'locked',value:false})}>{t('unlockLayer')}</button></div>}
    {links.length>0&&<details key={`links:${searching}`} open className="properties-links"><summary>{t('sourceLinks')}</summary>{links.map(renderSetting)}</details>}
    <LayerProperties snapshot={snapshot} dispatch={dispatch} language={language} effects={effects} interactionPending={interactionPending} query={query} modifiedOnly={modifiedOnly}/>
    {!effect?<p role="alert">{t('missing')}</p>:groups.map(group=><details open key={`${group}:${searching}`}><summary>{properties.find(s=>s.group?.id===group)?.group?.label[language]??t('base')}</summary>{properties.filter(s=>(s.group?.id??'base')===group).map(renderSetting)}</details>)}
    {searching&&found.matches.length+layerMatches.length===0&&<div className="empty-state"><p>{t('noSettingsFound')}</p><button onClick={()=>{setQuery('');setModifiedOnly(false);}}>{t('clearSettingsSearch')}</button></div>}
    {resetRevision!==null&&<Dialog title={t('resetSettingsTitle')} closeLabel={t('closeCancel')} onClose={()=>setResetRevision(null)}>
      <p>{t('resetBaselineHint')}</p><p>{t('resetEffectHint')}</p>
      <div className="actions"><button disabled={editingDisabled||!effect||changedCount===0} onClick={()=>reset('effect',null,resetRevision)}>{t('resetEffectSettings')} ({changedCount})</button><button disabled={editingDisabled||layerCount===0} onClick={()=>reset('layer',null,resetRevision)}>{t('resetLayerSettings')} ({layerCount})</button></div>
    </Dialog>}
    {pasting&&<PasteSettings snapshot={snapshot} dispatch={dispatch} effects={effects} language={language} interactionPending={interactionPending} onClose={()=>setPasting(false)}/>}
  </div>;
}
export function register(host:UiHost){host.registerPanel({id:'properties',label:{ru:'Свойства',en:'Properties'},component:PropertiesPanel});}
