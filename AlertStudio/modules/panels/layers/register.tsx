import {useEffect,useState,useRef,type DragEvent} from 'react';
import type { PanelProps, UiHost } from '../../../sdk/ui';
import { translator } from '../../../locales/platform';
import {Dialog} from '../../../ui-kit/Dialog';
export function LayersPanel({snapshot,dispatch,language,effects,interactionPending}:PanelProps){
  const t=translator(language),objects=snapshot.project.objects;
  const nameInput=useRef<HTMLInputElement>(null);
  const [query,setQuery]=useState(''),[type,setType]=useState('');
  const [rename,setRename]=useState<{id:string;original:string;value:string}|null>(null);
  const [drag,setDrag]=useState<{id:string;revision:number}|null>(null),[drop,setDrop]=useState<{id:string;placement:'above'|'below'}|null>(null);
  const selected=objects.find(o=>o.id===snapshot.selected),label=(id:string)=>effects.find(e=>e.id===id)?.label[language]??id;
  const types=[...new Set(objects.map(o=>o.type))];
  const shown=[...objects].reverse().filter(o=>(!type||o.type===type)&&`${o.name} ${o.type} ${label(o.type)} ${o.id}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  useEffect(()=>{setQuery('');setType('');setRename(null);setDrag(null);setDrop(null);},[snapshot.project.id]);
  useEffect(()=>{
    if(interactionPending)setRename(null);
    if(rename&&!objects.some(o=>o.id===rename.id&&o.name===rename.original))setRename(null);
    if(drag&&(drag.revision!==snapshot.revision||interactionPending)){setDrag(null);setDrop(null);}
    if(type&&!types.includes(type))setType('');
  },[snapshot.revision,interactionPending]);
  useEffect(()=>{if(rename){nameInput.current?.focus();nameInput.current?.select();}},[rename?.id]);
  function beginRename(id:string){const o=objects.find(o=>o.id===id);if(o&&!interactionPending)setRename({id,original:o.name,value:o.name});}
  function moveToEnd(top:boolean){if(selected)dispatch({type:'move',id:selected.id,targetId:(top?objects.at(-1):objects[0])!.id,placement:top?'above':'below',revision:snapshot.revision});}
  function dragOver(event:DragEvent<HTMLDivElement>,id:string){
    if(!drag||interactionPending||drag.id===id)return;
    event.preventDefault();event.dataTransfer.dropEffect='move';
    const rect=event.currentTarget.getBoundingClientRect();setDrop({id,placement:event.clientY<rect.top+rect.height/2?'above':'below'});
    const list=event.currentTarget.parentElement!,bounds=list.getBoundingClientRect();
    if(event.clientY<bounds.top+28)list.scrollTop-=16;else if(event.clientY>bounds.bottom-28)list.scrollTop+=16;
  }
  return <div className="layers-panel panel-body">
    <div className="layers-tools">
      <p className="eyebrow">{t('shownLayers')} {shown.length}/{objects.length}<span className="layers-project"> · {snapshot.project.name}</span></p>
      <div className="layers-filters"><input type="search" aria-label={t('layerSearch')} placeholder={t('layerSearch')} value={query} onChange={e=>setQuery(e.target.value)}/>
      <select aria-label={t('layerType')} value={type} onChange={e=>setType(e.target.value)}><option value="">{t('allLayerTypes')}</option>{types.map(id=><option key={id} value={id}>{label(id)}</option>)}</select></div>
      <p className="layers-hint">{t('layerOrderHint')}</p>
    </div>
    <div className="layers-list" onDragLeave={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node|null))setDrop(null);}}>
      {objects.length===0&&<div className="empty-state"><h2>{t('emptyLayersTitle')}</h2><p>{t('emptyLayersHint')}</p></div>}
      {objects.length>0&&shown.length===0&&<div className="empty-state"><p>{t('noMatchingLayers')}</p><button onClick={()=>{setQuery('');setType('');}}>{t('clearLayerFilters')}</button></div>}
      {shown.map(o=><div key={o.id} data-layer-id={o.id} data-drop={drop?.id===o.id?drop.placement:undefined} className={'layer-row '+(snapshot.selected===o.id?'selected':'')+(drag?.id===o.id?' dragging':'')}
        onDragOver={e=>dragOver(e,o.id)} onDrop={e=>{
          e.preventDefault();if(drag&&drop?.id===o.id&&!interactionPending)dispatch({type:'move',id:drag.id,targetId:o.id,placement:drop.placement,revision:drag.revision});setDrag(null);setDrop(null);
        }}>
        <button className="layer-grip" aria-label={`${t('dragLayer')} ${o.name}`} title={t('layerOrderHint')} disabled={interactionPending} draggable={!interactionPending} onClick={()=>dispatch({type:'select',id:o.id})}
          onDragStart={e=>{e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('application/x-alertstudio-layer',o.id);setDrag({id:o.id,revision:snapshot.revision});}}
          onDragEnd={()=>{setDrag(null);setDrop(null);}}>⠿</button>
        <input type="checkbox" disabled={interactionPending} aria-label={`${t('visibility')} ${o.name}`} checked={o.visible} onChange={()=>dispatch({type:'visibility',id:o.id})}/>
        <button className="layer-select" disabled={interactionPending} aria-pressed={snapshot.selected===o.id} onKeyDown={e=>{if(e.key==='F2'){e.preventDefault();beginRename(o.id);}}} onClick={()=>dispatch({type:'select',id:o.id})}><span>{o.name}</span><small>{label(o.type)} · {o.id.slice(0,8)}</small></button>
      </div>)}
    </div>
    {selected&&<div className="layers-footer"><p className="layers-selection">{t('selectedLayer')}: {selected.name}</p><div className="actions">
      <button disabled={interactionPending} onClick={()=>beginRename(selected.id)}>{t('renameLayer')}</button>
      <button disabled={interactionPending} onClick={()=>dispatch({type:'duplicate',id:selected.id})}>{t('duplicate')}</button><button className="danger-button" disabled={interactionPending} onClick={()=>dispatch({type:'remove',id:selected.id})}>{t('remove')}</button>
      <button disabled={interactionPending||objects.at(-1)?.id===selected.id} onClick={()=>dispatch({type:'reorder',id:selected.id,direction:'up'})}>{t('layerUp')}</button>
      <button disabled={interactionPending||objects[0]?.id===selected.id} onClick={()=>dispatch({type:'reorder',id:selected.id,direction:'down'})}>{t('layerDown')}</button>
      <button disabled={interactionPending||objects.at(-1)?.id===selected.id} onClick={()=>moveToEnd(true)}>{t('layerTop')}</button>
      <button disabled={interactionPending||objects[0]?.id===selected.id} onClick={()=>moveToEnd(false)}>{t('layerBottom')}</button>
    </div></div>}
    {rename&&<Dialog title={t('renameLayer')} closeLabel={t('closeCancel')} onClose={()=>setRename(null)}><form onSubmit={e=>{e.preventDefault();if(!interactionPending&&rename.value.trim()&&rename.value.length<=200){dispatch({type:'rename',id:rename.id,name:rename.value});setRename(null);}}}>
      <label>{t('layerName')}<input ref={nameInput} maxLength={200} value={rename.value} onChange={e=>setRename({...rename,value:e.target.value})}/></label>
      <button className="primary" disabled={interactionPending||!rename.value.trim()}>{t('applyLayerName')}</button>
    </form></Dialog>}
  </div>;
}
export function register(host:UiHost){host.registerPanel({id:'layers',label:{ru:'Слои',en:'Layers'},component:LayersPanel});}
