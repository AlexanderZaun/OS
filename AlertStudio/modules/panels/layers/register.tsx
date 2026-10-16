import type { PanelProps, UiHost } from '../../../sdk/ui';
import { translator } from '../../../locales/platform';
export function LayersPanel({snapshot,dispatch,language}:PanelProps){const t=translator(language);return <div className="layers-panel panel-body">
  <p className="eyebrow">{snapshot.project.objects.length} · {snapshot.project.name}</p>
  {[...snapshot.project.objects].reverse().map(o=><div key={o.id} className={'layer-row '+(snapshot.selected===o.id?'selected':'')}>
    <input type="checkbox" aria-label={`${t('visibility')} ${o.name}`} checked={o.visible} onChange={()=>dispatch({type:'visibility',id:o.id})}/>
    <button onClick={()=>dispatch({type:'select',id:o.id})}><span>{o.name}</span><small>{o.type} · {o.id.slice(0,8)}</small></button>
  </div>)}
  {snapshot.selected&&<div className="actions"><button onClick={()=>dispatch({type:'duplicate',id:snapshot.selected!})}>{t('duplicate')}</button><button onClick={()=>dispatch({type:'remove',id:snapshot.selected!})}>{t('remove')}</button></div>}
</div>;}
export function register(host:UiHost){host.registerPanel({id:'layers',label:{ru:'Слои',en:'Layers'},component:LayersPanel});}
