import type {PanelProps,UiHost} from '../../../sdk/ui';
import type {HistoryEntry} from '../../../contracts/editor-session';
import {translator,type TranslationKey} from '../../../locales/platform';
const actionLabels:Partial<Record<HistoryEntry['action'],TranslationKey>>={add:'historyAdd',remove:'remove',duplicate:'duplicate',visibility:'visibility',rename:'renameLayer',set:'historySetting',patch:'historyMove',layer:'layerAppearance',editor:'historyLayerState',notification:'historyNotification',reorder:'historyReorder',move:'historyReorder','clear-solo':'clearSolo','settings-reset':'resetSettingsTitle','settings-paste':'pasteSettings'};
const fields:Record<string,TranslationKey>={locked:'lockLayer',solo:'soloLayer',tag:'layerTag',blend:'layerBlend',clip:'layerClip',opacity:'layerOpacity',hue:'layerHue',saturation:'layerSaturation',introDuration:'introDuration',holdDuration:'holdDuration',outroDuration:'outroDuration',introFade:'introFade',outroFade:'outroFade'};
export function HistoryPanel({snapshot,dispatch,language,effects,interactionPending}:PanelProps){
  const t=translator(language),history=snapshot.history??{past:[],future:[],limit:100},current=history.past.at(-1)?.id??null;
  const rows=[...history.past,...history.future].reverse();
  const jump=(target:number|null)=>dispatch({type:'history-jump',target,revision:snapshot.revision});
  function description(entry:HistoryEntry){
    const effectField=entry.action==='set'||(entry.action==='settings-reset'&&entry.scope==='effect');
    const field=entry.key?(effectField?effects.find(e=>e.id===entry.objectType)?.settings.find(s=>s.id===entry.key)?.label[language]:undefined)??(fields[entry.key]?t(fields[entry.key]):entry.key):'';
    return [t(actionLabels[entry.action]??'historySetting'),entry.name,field].filter(Boolean).join(' · ');
  }
  return <div className="history-panel panel-body">
    <div className="history-tools"><div className="actions"><button aria-label={t('undo')} title={t('undo')} disabled={interactionPending||!snapshot.canUndo} onClick={()=>dispatch({type:'undo'})}>↶</button><button aria-label={t('redo')} title={t('redo')} disabled={interactionPending||!snapshot.canRedo} onClick={()=>dispatch({type:'redo'})}>↷</button></div><p title={t('historyHint')}>{t('historyCapacity')}: {history.limit}</p></div>
    <div className="history-list">
      {!rows.length&&<p>{t('historyEmpty')}</p>}
      {rows.map(entry=>{const applied=history.past.some(e=>e.id===entry.id),label=description(entry);return <button key={entry.id} className="history-row" data-history-id={entry.id} data-applied={applied} aria-current={entry.id===current?'step':undefined} disabled={interactionPending} title={`${label} · ${new Date(entry.time).toLocaleString(language)}`} onClick={()=>jump(entry.id)}><span>{label}</span><small>{entry.id===current?t('historyCurrent'):applied?t('historyApplied'):t('historyFuture')} · {new Date(entry.time).toLocaleTimeString(language)}</small></button>;})}
      <button className="history-row" aria-current={current===null?'step':undefined} disabled={interactionPending||!rows.length} onClick={()=>jump(null)}>{t('historyStart')}</button>
    </div>
  </div>;
}
export function register(host:UiHost){host.registerPanel({id:'history',label:{ru:'История действий',en:'Action history'},component:HistoryPanel});}
