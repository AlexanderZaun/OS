import type { PanelProps, UiHost } from '../../../sdk/ui';
import { translator } from '../../../locales/platform';
export function PropertiesPanel({snapshot,dispatch,language,effects}:PanelProps){const t=translator(language),object=snapshot.project.objects.find(o=>o.id===snapshot.selected),effect=effects.find(e=>e.id===object?.type);
  if(!object)return <div className="panel-body"><h2>{t('scene')}</h2><p>{snapshot.project.width} × {snapshot.project.height}</p><p>{t('empty')}</p></div>;
  return <div className="panel-body properties-panel"><h2>{object.name}</h2>{!effect||effect.version!==snapshot.project.modules[object.type]?<p role="alert">{t('missing')}</p>:<details open><summary>{t('base')}</summary>{effect.settings.map(s=><label key={s.id}>{s.label[language]} {s.unit&&<small>{s.unit}</small>}<input aria-label={s.label[language]} type={s.type==='number'?'number':s.type==='color'?'color':'text'} value={String(object.settings[s.id]??s.default)} min={s.min} max={s.max} step={s.type==='number'?1:undefined} onChange={e=>{if(s.type==='number'&&e.target.value==='')return;dispatch({type:'set',id:object.id,key:s.id,value:s.type==='number'?Number(e.target.value):e.target.value});}}/></label>)}</details>}</div>;
}
export function register(host:UiHost){host.registerPanel({id:'properties',label:{ru:'Свойства',en:'Properties'},component:PropertiesPanel});}
