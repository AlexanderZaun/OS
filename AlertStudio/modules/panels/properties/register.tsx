import type { PanelProps, UiHost } from '../../../sdk/ui';
import { translator } from '../../../locales/platform';

export function PropertiesPanel({snapshot,dispatch,language,effects,interactionPending}: PanelProps) {
  const t = translator(language);
  const object = snapshot.project.objects.find(object => object.id === snapshot.selected);
  const effect = effects.find(effect => effect.id === object?.type);
  if (!object) return <div className="panel-body">
    <h2>{t('scene')}</h2><p>{snapshot.project.width} × {snapshot.project.height}</p><p>{t('empty')}</p>
  </div>;
  return <div className="panel-body properties-panel">
    <h2>{object.name}</h2>
    {!effect || effect.version !== snapshot.project.modules[object.type] ? <p role="alert">{t('missing')}</p> :
      <details open><summary>{t('base')}</summary>{effect.settings.map(setting => <label key={setting.id}>
        <span className="field-label">{setting.label[language]}{setting.unit && <small>{setting.unit}</small>}</span>
        <input aria-label={setting.label[language]} disabled={interactionPending}
          type={setting.type === 'number' ? 'number' : setting.type === 'color' ? 'color' : 'text'}
          value={String(object.settings[setting.id] ?? setting.default)} min={setting.min} max={setting.max}
          step={setting.type === 'number' ? 1 : undefined}
          onChange={event => {
            if (setting.type === 'number' && event.target.value === '') return;
            dispatch({type:'set',id:object.id,key:setting.id,value:setting.type === 'number' ? Number(event.target.value) : event.target.value});
          }} />
      </label>)}</details>}
  </div>;
}

export function register(host: UiHost) {
  host.registerPanel({id:'properties',label:{ru:'Свойства',en:'Properties'},component:PropertiesPanel});
}
