import {useEffect,useState} from 'react';
import type {PanelProps} from '../../../sdk/ui';
import {translator} from '../../../locales/platform';
import {Dialog} from '../../../ui-kit/Dialog';
import {pasteKeys} from '../../../core/scene/paste-keys';
export function PasteSettings({snapshot,dispatch,effects,language,interactionPending,onClose}:PanelProps&{onClose():void}){
  const t=translator(language),buffer=snapshot.clipboard,object=snapshot.project.objects.find(o=>o.id===snapshot.selected);
  const definition=effects.find(e=>e.id===object?.type&&e.version===snapshot.project.modules[object!.type]);
  const compatible=!!buffer?.values&&!!definition&&object?.type===buffer.type&&definition.version===buffer.version;
  const [effect,setEffect]=useState(compatible),[appearance,setAppearance]=useState(!compatible),[links,setLinks]=useState(false),[coordinates,setCoordinates]=useState(false);
  const [opened]=useState({revision:snapshot.revision,id:object?.id});
  useEffect(()=>{if(interactionPending||snapshot.revision!==opened.revision||object?.id!==opened.id||object?.editor?.locked)onClose();},[interactionPending,snapshot.revision,object?.id,object?.editor?.locked]);
  if(!buffer||!object)return null;
  const keys=effect&&compatible?pasteKeys(definition!,buffer.values!,object.settings,links,coordinates):[];
  return <Dialog title={t('pasteSettings')} closeLabel={t('closeCancel')} onClose={onClose}>
    <p>{t('copiedFrom')}: {buffer.name}</p><p>{t('pasteSettingsHint')}</p>
    <div className="paste-settings-options">
      <label><input type="checkbox" aria-label={t('pasteEffect')} disabled={!compatible||interactionPending} checked={effect&&compatible} onChange={e=>setEffect(e.target.checked)}/>{t('pasteEffect')}</label>
      {!compatible&&<p>{t('pasteEffectCompatibility')}</p>}
      {effect&&compatible&&<><label><input type="checkbox" checked={links} onChange={e=>setLinks(e.target.checked)}/>{t('pasteLinks')}</label><label><input type="checkbox" checked={coordinates} onChange={e=>setCoordinates(e.target.checked)}/>{t('pasteCoordinates')}</label></>}
      <label><input type="checkbox" checked={appearance} onChange={e=>setAppearance(e.target.checked)}/>{t('pasteAppearance')}</label>
    </div>
    <p>{t('pasteParameterCount')}: {keys.length}{appearance?` + ${t('layerAppearance')}`:''}</p>
    <button className="primary" disabled={interactionPending||object.editor?.locked||(!keys.length&&!appearance)} onClick={()=>{dispatch({type:'settings-paste',id:object.id,keys,appearance,revision:opened.revision});onClose();}}>{t('applyPastedSettings')}</button>
  </Dialog>;
}
