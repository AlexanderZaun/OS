import type {PanelProps,UiHost} from '../../../sdk/ui';
import {translator} from '../../../locales/platform';
export function PanelManager({workspace,language,interactionPending}:PanelProps){
  const t=translator(language);
  return <div className="panel-body panel-manager">
    <p className="caption">{t('panelManagerHint')}</p>
    <div className="panel-manager-actions">{workspace?.panels.filter(panel=>panel.id!=='panel-manager').map(panel=><div className="panel-manager-item" key={panel.id}>
      <span>{panel.label[language]}</span>
      <button disabled={interactionPending} aria-label={`${panel.label[language]} +`} title={t('openInside')}
        onClick={()=>workspace.open(panel.id)}>+</button>
      <button disabled={interactionPending} aria-label={`${panel.label[language]} ↗`} title={t('openOutside')}
        onClick={()=>workspace.detach(panel.id)}>↗</button>
    </div>)}</div>
  </div>;
}
export function register(host:UiHost){host.registerPanel({id:'panel-manager',label:{ru:'Панели',en:'Panels'},component:PanelManager});}
