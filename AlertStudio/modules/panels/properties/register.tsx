import type { PanelProps, UiHost } from '../../../sdk/ui';
import { translator } from '../../../locales/platform';

export function PropertiesPanel({snapshot,dispatch,language,effects,interactionPending}: PanelProps) {
  const t = translator(language);
  const object = snapshot.project.objects.find(object => object.id === snapshot.selected);
  const effect = effects.find(effect => effect.id === object?.type);
  const groups = [...new Set(effect?.settings.map(setting=>setting.group?.id??'base'))];
  if (!object) return <div className="panel-body">
    <h2>{t('scene')}</h2><p>{snapshot.project.width} × {snapshot.project.height}</p><p>{t('empty')}</p>
  </div>;
  return <div className="panel-body properties-panel">
    <h2>{object.name}</h2>
    {!effect || effect.version !== snapshot.project.modules[object.type] ? <p role="alert">{t('missing')}</p> :
      groups.map(group=><details open key={group}><summary>{effect.settings.find(s=>s.group?.id===group)?.group?.label[language]??t('base')}</summary>{effect.settings.filter(s=>(s.group?.id??'base')===group).map(setting => <label key={setting.id}>
        <span className="field-label">{setting.label[language]}{setting.unit && <small>{setting.unit}</small>}</span>
        {setting.type==='select' ? <select aria-label={setting.label[language]} disabled={interactionPending} value={String(object.settings[setting.id]??setting.default)}
          onChange={event=>dispatch({type:'set',id:object.id,key:setting.id,value:setting.options!.find(option=>String(option.value)===event.target.value)!.value})}>
          {setting.options?.map(option=><option key={String(option.value)} value={String(option.value)}>{option.label[language]}</option>)}
        </select> : <input aria-label={setting.label[language]} disabled={interactionPending}
          type={setting.type === 'number' ? 'number' : setting.type === 'color' ? 'color' : 'text'}
          value={String(object.settings[setting.id] ?? setting.default)} min={setting.min} max={setting.max}
          step={setting.type === 'number' ? setting.step??'any' : undefined}
          onChange={event => {
            if (setting.type === 'number' && event.target.value === '') return;
            dispatch({type:'set',id:object.id,key:setting.id,value:setting.type === 'number' ? Number(event.target.value) : event.target.value});
          }} />}
      </label>)}</details>)}
  </div>;
}

export function register(host: UiHost) {
  host.registerPanel({id:'properties',label:{ru:'Свойства',en:'Properties'},component:PropertiesPanel});
}
