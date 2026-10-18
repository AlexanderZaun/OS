import type {PanelProps} from '../../../sdk/ui';
import {useEffect,useId,useRef,useState} from 'react';
import {blendModes,type LayerKey} from '../../../contracts/layer';
import {defaultLayerStyle} from '../../../core/scene/layer-style';
import {translator} from '../../../locales/platform';
import {blendKeys,layerLabels,matchingLayerKeys} from './layer-fields';
import {SettingHeading} from './SettingHeading';
function LayerNumber({id,value,label,min,max,disabled,commit}:{id:string;value:number;label:string;min:number;max:number;disabled?:boolean;commit(value:number):void}){
  const [draft,setDraft]=useState(String(value)),[invalid,setInvalid]=useState(false),cancel=useRef(false);
  useEffect(()=>{setDraft(String(value));setInvalid(false);},[value]);
  return <input id={id} type="number" aria-label={label} title={`${min}…${max}`} aria-invalid={invalid} disabled={disabled} value={draft} min={min} max={max} step={1}
    onChange={e=>{setDraft(e.target.value);setInvalid(false);}}
    onBlur={()=>{if(cancel.current){cancel.current=false;return;}const n=Number(draft),valid=draft.trim()!==''&&Number.isInteger(n)&&n>=min&&n<=max;setInvalid(!valid);if(valid&&n!==value)commit(n);}}
    onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();e.currentTarget.blur();}if(e.key==='Escape'){e.preventDefault();cancel.current=true;setDraft(String(value));setInvalid(false);e.currentTarget.blur();}}}/>;
}
export function LayerProperties({snapshot,dispatch,language,interactionPending,query='',modifiedOnly=false}:PanelProps&{query?:string;modifiedOnly?:boolean}){
  const prefix=useId();
  const object=snapshot.project.objects.find(o=>o.id===snapshot.selected);if(!object)return null;
  const t=translator(language),style=object.layer??defaultLayerStyle();
  const editingDisabled=interactionPending||object.editor?.locked;
  const change=(key:LayerKey,value:string|number|boolean)=>dispatch({type:'layer',id:object.id,key,value});
  const keys=matchingLayerKeys(object,query,modifiedOnly),defaults=defaultLayerStyle();if(!keys.length)return null;
  const heading=(key:LayerKey)=><SettingHeading id={`${prefix}-${key}`} label={t(layerLabels[key])} changed={style[key]!==defaults[key]} baseline={defaults[key]} language={language} disabled={editingDisabled} unit={key==='hue'?'°':key==='saturation'||key==='opacity'?'%':''} reset={()=>dispatch({type:'settings-reset',id:object.id,scope:'layer',key,revision:snapshot.revision})}/>;
  return <details className="layer-properties" open={query.trim()||modifiedOnly?true:undefined}><summary>{t('layerAppearance')}</summary>
    {keys.includes('blend')&&<div className="setting-field" data-layer-setting="blend" data-modified={style.blend!==defaults.blend||undefined}>{heading('blend')}<select id={`${prefix}-blend`} aria-label={t('layerBlend')} disabled={editingDisabled} value={style.blend} onChange={e=>change('blend',e.target.value)}>{blendModes.map((mode,i)=><option key={mode} value={mode}>{t(blendKeys[i])}</option>)}</select></div>}
    {keys.includes('clip')&&<div className="setting-field" data-layer-setting="clip" data-modified={style.clip!==defaults.clip||undefined}>{heading('clip')}<input id={`${prefix}-clip`} type="checkbox" aria-label={t('layerClip')} disabled={editingDisabled} checked={style.clip} onChange={e=>change('clip',e.target.checked)}/><details><summary>{t('layerClipHelp')}</summary><p>{t('layerClipHint')}</p></details></div>}
    {(['opacity','hue','saturation'] as const).filter(key=>keys.includes(key)).map(key=><div className="setting-field" key={key} data-layer-setting={key} data-modified={style[key]!==defaults[key]||undefined}>{heading(key)}<LayerNumber id={`${prefix}-${key}`} label={t(layerLabels[key])} disabled={editingDisabled} value={style[key]} min={key==='hue'?-180:0} max={key==='opacity'?100:key==='hue'?180:200} commit={n=>change(key,n)}/></div>)}
  </details>;
}
