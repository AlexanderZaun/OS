import {useEffect,useRef,useState} from 'react';
import type {Command,Project} from '../../contracts/project';
import type {NotificationKey,NotificationWorkspace as Workspace} from '../../contracts/notification';
import type {Language} from '../../sdk/ui';
import {translator} from '../../locales/platform';
import {defaultNotification,notificationDefinitions,validNotificationValue} from '../../core/notification/definitions';
import {notificationDuration} from '../../core/notification/evaluate';
import {Dialog} from '../../ui-kit/Dialog';

function Duration({field,value,label,shortLabel,disabled,commit}:{field:'introDuration'|'holdDuration'|'outroDuration';value:number;label:string;shortLabel:string;disabled:boolean;commit(value:number):void}){
  const [draft,setDraft]=useState(String(value)),[invalid,setInvalid]=useState(false),cancel=useRef(false),definition=notificationDefinitions[field];
  useEffect(()=>{setDraft(String(value));setInvalid(false);},[value]);
  return <label className="stage-duration"><span title={label}>{shortLabel}</span><input aria-label={label} title={`${label} · ${definition.min}–${definition.max} s`} type="number" min={definition.min} max={definition.max} step={definition.step} disabled={disabled} value={draft} aria-invalid={invalid}
    onChange={e=>{setDraft(e.target.value);setInvalid(false);}} onBlur={()=>{
      if(cancel.current){cancel.current=false;return;}
      const next=Number(draft),valid=draft.trim()!==''&&validNotificationValue(field,next);setInvalid(!valid);
      if(valid&&next!==value)commit(next);
    }} onKeyDown={e=>{
      if(e.key==='Enter'){e.preventDefault();e.currentTarget.blur();}
      if(e.key==='Escape'){e.preventDefault();cancel.current=true;setDraft(String(value));setInvalid(false);e.currentTarget.blur();}
    }}/><small>s</small></label>;
}

function FadeToggle({value,label,disabled,commit}:{value:boolean;label:string;disabled:boolean;commit(value:boolean):void}){
  const [checked,setChecked]=useState(value);
  useEffect(()=>{if(!disabled)setChecked(value);},[value,disabled]);
  return <label className="stage-check"><input type="checkbox" checked={checked} disabled={disabled} onChange={e=>{setChecked(e.target.checked);commit(e.target.checked);}}/>{label}</label>;
}

export function NotificationWorkspace({project,workspace,language,disabled,dispatch,preview}:{project:Project;workspace:Workspace;language:Language;disabled:boolean;dispatch(command:Command):void;preview(workspace:Workspace):void}){
  const [showSettings,setShowSettings]=useState(false);
  const [help,setHelp]=useState(false);
  useEffect(()=>setShowSettings(false),[workspace,project.id]);
  useEffect(()=>{if(disabled)setHelp(false);},[disabled]);
  const t=translator(language),settings=project.notification??defaultNotification();
  const modes=[['main','workspaceMain'],['intro','workspaceIntro'],['outro','workspaceOutro'],['assembly','workspaceAssembly']] as const;
  const durationKeys=workspace==='intro'?['introDuration'] as const:workspace==='outro'?['outroDuration'] as const:workspace==='main'?['holdDuration'] as const:['introDuration','holdDuration','outroDuration'] as const;
  const labels={introDuration:t('introDuration'),holdDuration:t('holdDuration'),outroDuration:t('outroDuration')};
  const shortLabels={introDuration:t('workspaceIntro'),holdDuration:t('stageHoldShort'),outroDuration:t('workspaceOutro')};
  function update(key:NotificationKey,value:number|boolean){dispatch({type:'notification',key,value});}
  const end=notificationDuration(settings,'assembly'),holdEnd=Number((settings.introDuration+settings.holdDuration).toFixed(6));
  const controls=<div className="stage-settings">
    {durationKeys.map(field=><Duration key={`${project.id}-${workspace}-${field}`} field={field} value={settings[field]} label={labels[field]} shortLabel={shortLabels[field]} disabled={disabled} commit={value=>update(field,value)}/>)}
    {(workspace==='intro'||workspace==='assembly')&&<FadeToggle value={settings.introFade} label={t('introFade')} disabled={disabled} commit={value=>update('introFade',value)}/>}
    {(workspace==='outro'||workspace==='assembly')&&<FadeToggle value={settings.outroFade} label={t('outroFade')} disabled={disabled} commit={value=>update('outroFade',value)}/>}
  </div>;
  return <section className="notification-workspace" aria-label={t('notificationWorkspaces')} data-workspace={workspace}>
    <div className="stage-heading"><div className="stage-switcher" role="group" aria-label={t('notificationWorkspaces')}>
      {modes.map(([mode,label])=><button key={mode} aria-pressed={mode===workspace} disabled={disabled} onClick={()=>{if(mode!==workspace)preview(mode);}}>{t(label)}</button>)}
    </div>{workspace!=='assembly'&&controls}{workspace==='assembly'&&<button className="stage-options-toggle" aria-expanded={showSettings} disabled={disabled} onClick={()=>setShowSettings(!showSettings)}>{t('stageSettings')}</button>}<span className="stage-total">{t('totalDuration')}: {end} s</span><button className="stage-help" aria-label={t('notificationHelp')} title={t('notificationHelp')} disabled={disabled} onClick={()=>setHelp(true)}>?</button></div>
    {workspace==='assembly'&&showSettings&&controls}
    {workspace==='assembly'&&<div className="stage-sequence" aria-label={t('notificationSequence')}>
      <span>{t('workspaceIntro')}<small>0–{settings.introDuration} s</small></span><span>{t('workspaceMain')}<small>{settings.introDuration}–{holdEnd} s</small></span><span>{t('workspaceOutro')}<small>{holdEnd}–{end} s</small></span>
    </div>}
    {help&&<Dialog title={t('notificationHelp')} closeLabel={t('close')} onClose={()=>setHelp(false)}><p>{t('mainWorkspaceHint')}</p><p>{t('stageWorkspaceHint')}</p></Dialog>}
  </section>;
}
