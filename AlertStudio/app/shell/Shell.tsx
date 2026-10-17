import { useEffect, useState, useRef } from 'react';
import type { Snapshot, Command } from '../../contracts/project';
import type { RecoveryInfo, SessionStatus } from '../../contracts/recovery';
import type {WindowCloseState,CloseChoice} from '../../contracts/close';
import type { Registry } from '../bootstrap/registry';
import type { Language, PanelProps } from '../../sdk/ui';
import { Workspace, type WorkspaceHandle } from '../../adapters/workspace-dockview/Workspace';
import { Dialog } from '../../ui-kit/Dialog';
import { translator, type TranslationKey } from '../../locales/platform';
import {MenuBar,type MenuDefinition,type MenuItem} from '../../ui-kit/MenuBar';
import {usePlayback} from '../../modules/panels/canvas/usePlayback';

const initialSession: SessionStatus = {autosave:'idle',savedAt:null,error:null,folder:null,usedBackup:false,recovered:false};
const autosaveKeys: Record<SessionStatus['autosave'], TranslationKey> = {
  idle:'autosaveIdle',pending:'autosavePending',saving:'autosaveSaving',saved:'autosaveSaved',error:'autosaveError',
};
const knownErrors: TranslationKey[] = ['projectBusy','projectUnreadable','projectOperationBusy','folderLockUnsupported','projectFolderContainsOtherProject'];

export function Shell({registry, initial}: {registry: Registry; initial: Snapshot}) {
  const detached = new URLSearchParams(location.search).get('panel');
  const [snapshot, setSnapshot] = useState(initial);
  const [language, setLanguage] = useState<Language>('ru');
  const [welcome, setWelcome] = useState(!detached && !initial.dirty && initial.project.objects.length === 0);
  const [hasWorkspace,setHasWorkspace]=useState(!welcome);
  const [modal, setModal] = useState<'extensions' | 'recovery' | 'scene' | 'shortcuts' | 'about' | 'rename' | null>(null);
  const [rename,setRename]=useState({id:'',original:'',value:''});
  const [status, setStatus] = useState('');
  const [hasError, setHasError] = useState(false);
  const [operationWorking, setWorking] = useState(false);
  const [closeState,setCloseState]=useState<WindowCloseState>(null),[closeResponding,setCloseResponding]=useState(false);
  const working=operationWorking||closeState!==null;
  const [transitioning, setTransitioning] = useState(false);
  const [workspace, setWorkspace] = useState(0);
  const workspaceRef=useRef<WorkspaceHandle>(null);
  const [session, setSession] = useState(initialSession);
  const [recoveries, setRecoveries] = useState<RecoveryInfo[]>([]);
  const [name, setName] = useState('My alert');
  const [width, setWidth] = useState(1920);
  const [height, setHeight] = useState(1080);
  const [background, setBackground] = useState('transparent');
  const t = translator(language);
  const playback=usePlayback();
  useEffect(()=>{if(!welcome)setHasWorkspace(true);},[welcome]);

  function report(error: unknown) {
    const message = String(error);
    const key = knownErrors.find(key => message.includes(key));
    setStatus(key ? t(key) : message);
    setHasError(true);
  }

  async function run(action: () => Promise<unknown>) {
    if(closeState)return;
    setWorking(true);
    setStatus('');
    setHasError(false);
    try { await action(); } catch (error) { report(error); } finally { setWorking(false); }
  }

  function acceptSnapshot(next: Snapshot) {
    setSnapshot(current => next.revision >= current.revision ? next : current);
  }

  function dispatch(command: Command) {
    if (working || transitioning) return;
    const structural = command.type !== 'set' && command.type !== 'visibility';
    if (structural) setTransitioning(true);
    void window.studio.command(command).then(acceptSnapshot).catch(report).finally(() => {
      if (structural) setTransitioning(false);
    });
  }

  useEffect(() => {
    const unsubscribe = window.studio.subscribe(acceptSnapshot);
    const unsubscribeSession = window.studio.subscribeSession(setSession);
    void window.studio.session().then(setSession).catch(report);
    void window.studio.recoveries().then(setRecoveries).catch(report);
    return () => { unsubscribe(); unsubscribeSession(); };
  }, []);
  useEffect(()=>{
    let active=true,received=false;
    const accept=(state:WindowCloseState)=>{if(active){setCloseState(state);if(state)setModal(null);}};
    const unsubscribe=window.studio.subscribeClose(state=>{received=true;accept(state);});
    void window.studio.closeState().then(state=>{if(!received)accept(state);}).catch(report);
    return()=>{active=false;unsubscribe();};
  },[]);
  async function respondClose(choice:CloseChoice){
    if(!closeState||closeResponding||closeState.phase!=='confirm')return;
    setCloseResponding(true);
    try{await window.studio.respondClose(closeState.id,choice);}catch(error){report(error);}finally{setCloseResponding(false);}
  }

  useEffect(() => {
    function key(event: KeyboardEvent) {
      if (event.defaultPrevented || modal !== null || working || transitioning || closeState || (event.target instanceof Element && event.target.closest('[role="dialog"],[role="menu"],[role="menubar"]'))) return;
      const key=event.key.toLowerCase();
      if(event.ctrlKey&&key==='n'&&!detached){event.preventDefault();setWelcome(true);}
      if(event.ctrlKey&&key==='o'){event.preventDefault();void openProject();}
      if (event.ctrlKey && key === 's') {
        event.preventDefault();
        void run(() => window.studio.save(event.shiftKey));
      }
      if (event.ctrlKey && key === 'z' && !(event.target instanceof Element&&event.target.closest('input,textarea,[contenteditable="true"]'))) {
        event.preventDefault();
        dispatch({type:event.shiftKey ? 'redo' : 'undo'});
      }
    }
    addEventListener('keydown', key);
    return () => removeEventListener('keydown', key);
  }, [language, modal, working, transitioning]);

  async function showRecovery() {
    await run(async () => {
      setRecoveries(await window.studio.recoveries());
      setModal('recovery');
    });
  }

  async function openProject() {
    await run(async () => { if (await window.studio.open()) setWelcome(false); });
  }

  const props: PanelProps = {snapshot, dispatch, language, effects:registry.effects, interactionPending:working || transitioning,canvasRenderers:registry.canvasRenderers};
  const Panel = registry.panels.find(panel => panel.id === detached)?.component;
  const savedTime = session.savedAt ? new Date(session.savedAt).toLocaleTimeString(language, {hour:'2-digit',minute:'2-digit'}) : '';
  const selected=snapshot.project.objects.find(object=>object.id===snapshot.selected),objects=snapshot.project.objects;
  const editorDisabled=working||transitioning||welcome;
  function item(id:string,label:string,action:()=>void,options:Partial<MenuItem>={}):MenuItem{return {id,label,action,...options};}
  const panelMenu=(group:TranslationKey,action:(id:string)=>void,suffix='')=>registry.panels.filter(panel=>group!=='separateWindow'||panel.id!=='panel-manager').map(panel=>
    item(`${group}-${panel.id}`,panel.label[language]+suffix,()=>action(panel.id),{group:t(group),disabled:editorDisabled}));
  const menus:MenuDefinition[]=[
    {id:'file',label:t('menuFile'),items:[
      item('new',t('new'),()=>setWelcome(true),{disabled:working,shortcut:'Ctrl+N'}),
      item('example',t('cloudPreset'),()=>void run(async()=>{if(await window.studio.createPreset('cloud-network',language))setWelcome(false);}),{disabled:working}),
      item('open',t('open'),()=>void openProject(),{disabled:working,shortcut:'Ctrl+O'}),
      item('save',t('save'),()=>void run(()=>window.studio.save()),{disabled:working,shortcut:'Ctrl+S'}),
      item('save-as',t('saveAs'),()=>void run(()=>window.studio.save(true)),{disabled:working,shortcut:'Ctrl+Shift+S'}),
      item('recovery',t('recovery'),()=>void showRecovery(),{disabled:working}),
    ]},
    {id:'edit',label:t('menuEdit'),items:[
      item('undo',t('undo'),()=>dispatch({type:'undo'}),{disabled:editorDisabled||!snapshot.canUndo,shortcut:'Ctrl+Z'}),
      item('redo',t('redo'),()=>dispatch({type:'redo'}),{disabled:editorDisabled||!snapshot.canRedo,shortcut:'Ctrl+Shift+Z'}),
      item('extensions',t('extensions'),()=>setModal('extensions'),{disabled:working}),
      item('ru','Русский',()=>setLanguage('ru'),{checked:language==='ru',group:t('language')}),
      item('en','English',()=>setLanguage('en'),{checked:language==='en',group:t('language')}),
    ]},
    {id:'scene',label:t('menuScene'),items:[item('info',t('sceneInfo'),()=>setModal('scene'),{disabled:working}),
      item('fit',t('fit'),()=>workspaceRef.current?.canvas('fit'),{disabled:editorDisabled})]},
    {id:'object',label:t('menuObject'),items:[item('catalog',t('showCatalog'),()=>workspaceRef.current?.show('objects'),{disabled:editorDisabled}),
      item('rename',t('renameObject'),()=>{if(selected){setRename({id:selected.id,original:selected.name,value:selected.name});setModal('rename');}},{disabled:editorDisabled||!selected,group:t('objectActions')}),
      ...(['duplicate','visibility','remove'] as const).map(type=>item(type,t(type),()=>{if(selected)dispatch({type,id:selected.id});},{disabled:editorDisabled||!selected,...(type==='visibility'?{checked:selected?.visible??false}:{})})),
      ...(['up','down'] as const).map(direction=>item(direction,t(direction==='up'?'layerUp':'layerDown'),()=>{if(selected)dispatch({type:'reorder',id:selected.id,direction});},{disabled:editorDisabled||!selected||(direction==='up'?objects.at(-1):objects[0])?.id===selected?.id})),
      ...([true,false] as const).map(top=>item(top?'top':'bottom',t(top?'layerTop':'layerBottom'),()=>{if(selected)dispatch({type:'move',id:selected.id,targetId:(top?objects.at(-1):objects[0])!.id,placement:top?'above':'below',revision:snapshot.revision});},{disabled:editorDisabled||!selected||(top?objects.at(-1):objects[0])?.id===selected?.id})),
    ]},
    {id:'playback',label:t('menuPlayback'),items:[
      item('toggle',t(playback.state.playing?'pause':'play'),()=>playback.command({type:'toggle'}),{disabled:editorDisabled}),
      item('start',t('restartPlayback'),()=>playback.command({type:'seek',time:0}),{disabled:editorDisabled}),
      item('loop',t('loop'),()=>playback.command({type:'configure',duration:playback.state.duration,speed:playback.state.speed,loop:!playback.state.loop}),{checked:playback.state.loop,disabled:editorDisabled}),
      ...[.25,.5,1,2].map(speed=>item(`speed-${speed}`,`${speed}×`,()=>playback.command({type:'configure',duration:playback.state.duration,loop:playback.state.loop,speed}),{checked:playback.state.speed===speed,disabled:editorDisabled,group:t('playbackSpeed')})),
    ]},
    {id:'view',label:t('menuView'),items:([
      ['fit','fit','Home'],['selected','frameSelection','F'],['actual','actualSize','1'],['center','centerCanvas',''],['zoomIn','zoomIn',''],['zoomOut','zoomOut',''],['hand','handTool','H'],
    ] as const).map(([action,key,shortcut])=>item(action,t(key),()=>workspaceRef.current?.canvas(action),{shortcut,disabled:editorDisabled||(action==='selected'&&!selected)}))},
    {id:'window',label:t('menuWindow'),items:[...panelMenu('showPanel',id=>workspaceRef.current?.show(id)),...panelMenu('addView',id=>workspaceRef.current?.add(id),' +'),
      ...panelMenu('separateWindow',id=>void run(()=>window.studio.detach(id)),' ↗'),
      item('reset',t('reset'),()=>{try{localStorage.removeItem('alert-studio-workspace');setWorkspace(value=>value+1);}catch(error){report(error);}},{disabled:editorDisabled,group:t('menuWindow')})]},
    {id:'help',label:t('menuHelp'),items:[item('shortcuts',t('shortcuts'),()=>setModal('shortcuts')),item('about',t('about'),()=>setModal('about'))]},
  ];

  return <main className={detached ? 'studio-shell detached-shell' : 'studio-shell'}>
    <header className="topbar">
      <strong><i /> ALERT<span>STUDIO</span></strong>
      <span className="project-title">{snapshot.project.name}<small>{t(snapshot.dirty ? 'dirty' : 'clean')}</small></span>
      {detached&&<button className="quiet-button" onClick={() => setLanguage(language === 'ru' ? 'en' : 'ru')}>{language.toUpperCase()}</button>}
    </header>
    {!detached&&<MenuBar menus={menus} label={t('menuBar')} disabled={modal!==null||closeState!==null}/>}

    {detached ? <>
      <div className="detached-caption">{t('return')}</div>
      <div className="detached-content">{Panel && <Panel {...props} />}</div>
    </> : welcome ? <section className="welcome">
      <div className="welcome-copy">
        <div className="eyebrow">ALERT STUDIO / 0.1</div>
        <h1>{t('welcome')}</h1>
        <p>{t('intro')}</p>
        <div className="actions">
          <button onClick={() => void openProject()} disabled={working}>{t('open')}</button>
          {hasWorkspace && <button onClick={() => setWelcome(false)}>{t('resume')}</button>}
        </div>
        {recoveries.length > 0 && <button className="recovery-link" onClick={() => void showRecovery()}>{t('recovery')}<span className="count-badge">{recoveries.length}</span></button>}
      </div>
      <form className="project-form" onSubmit={event => {
        event.preventDefault();
        void run(async () => { if (await window.studio.create({name,width,height,background})) setWelcome(false); });
      }}>
        <h2>{t('new')}</h2>
        <label>{t('name')}<input required value={name} maxLength={200} onChange={event => setName(event.target.value)} /></label>
        <div className="size-inputs">
          <label>{t('width')}<input type="number" min={320} max={3840} required value={width} onChange={event => setWidth(Number(event.target.value))} /></label>
          <label>{t('height')}<input type="number" min={180} max={2160} required value={height} onChange={event => setHeight(Number(event.target.value))} /></label>
        </div>
        <label>{t('background')}<select value={background} onChange={event => setBackground(event.target.value)}>
          <option value="transparent">{t('transparent')}</option><option value="#101827">#101827</option><option value="#ffffff">#ffffff</option>
        </select></label>
        <button className="primary" type="submit" disabled={working}>{t('create')} →</button>
      </form>
    </section> : <>
      {session.usedBackup && <div className="notice-banner" role="alert">{t('backupNotice')}</div>}
      {session.recovered && <div className="notice-banner" role="alert">{t('recoveredNotice')}</div>}
      <div className="editor">
        <Workspace ref={workspaceRef} panels={registry.panels} props={props} instance={workspace} onDetach={type=>void run(()=>window.studio.detach(type))} />
      </div>
    </>}

    <footer>
      <span className={hasError ? 'status-message status-error' : 'status-message'} role="status">{status || registry.diagnostics.join(' · ') || t('check')}</span>
      <span className="autosave-status" data-testid="autosave-status" data-state={session.autosave} title={session.error ?? session.folder ?? ''}>
        <i />{t(autosaveKeys[session.autosave])}{session.autosave === 'saved' && savedTime ? ` · ${savedTime}` : ''}
      </span>
    </footer>
    {modal==='scene'&&<Dialog title={t('sceneInfo')} closeLabel={t('close')} onClose={()=>setModal(null)}>
      <dl className="project-info"><dt>{t('name')}</dt><dd>{snapshot.project.name}</dd><dt>{t('width')}</dt><dd>{snapshot.project.width} px</dd><dt>{t('height')}</dt><dd>{snapshot.project.height} px</dd><dt>{t('background')}</dt><dd>{snapshot.project.background==='transparent'?t('transparent'):snapshot.project.background}</dd><dt>{t('sceneObjects')}</dt><dd>{objects.length}</dd><dt>{t('savedFolder')}</dt><dd>{session.folder??t('unsavedProject')}</dd></dl><p>{t('sceneInfoHint')}</p>
    </Dialog>}
    {modal==='shortcuts'&&<Dialog title={t('shortcuts')} closeLabel={t('close')} onClose={()=>setModal(null)}><p>{t('shortcutsHint')}</p><p>{t('shortcutsProject')}</p><p>{t('shortcutsCanvas')}</p></Dialog>}
    {modal==='about'&&<Dialog title={t('about')} closeLabel={t('close')} onClose={()=>setModal(null)}><p>{t('aboutText')}</p><p>{t('aboutLimits')}</p></Dialog>}
    {modal==='rename'&&<Dialog title={t('renameObject')} closeLabel={t('closeCancel')} onClose={()=>setModal(null)}><form onSubmit={e=>{e.preventDefault();if(!working&&!transitioning&&rename.value.trim()&&objects.some(o=>o.id===rename.id&&o.name===rename.original)){dispatch({type:'rename',id:rename.id,name:rename.value});setModal(null);}}}>
      <label>{t('layerName')}<input autoFocus maxLength={200} value={rename.value} onChange={e=>setRename({...rename,value:e.target.value})}/></label><button className="primary" disabled={working||transitioning||!rename.value.trim()||!objects.some(o=>o.id===rename.id&&o.name===rename.original)}>{t('applyLayerName')}</button>
    </form></Dialog>}
    {closeState&&!closeState.owner&&<div className="notice-banner" role="status">{t('closeElsewhere')}</div>}
    {closeState?.owner&&<Dialog title={t('closeTitle')} closeLabel={t('closeCancel')}
      closeDisabled={closeResponding||closeState.phase!=='confirm'} onClose={()=>void respondClose('cancel')}>
      <p>{t(closeState.phase==='saving'?'closeSaving':closeState.phase==='closing'?'closeFinishing':'closeIntro')}</p>
      <h3>{closeState.name}</h3><p className="close-folder">{closeState.folder??t('unsavedProject')}</p>
      <p>{t(closeState.folder?'closeDiscardHint':'closeUnsavedDiscardHint')}</p>
      {closeState.error&&<div role="alert" className={closeState.error==='closeSaveCanceled'?'':'status-error'}><p>{t(closeState.error)}</p>{closeState.detail&&<p className="caption close-folder">{closeState.detail}</p>}</div>}
      <div className="dialog-actions">
        <button className="primary" disabled={closeResponding||closeState.phase!=='confirm'} onClick={()=>void respondClose('save')}>{t('closeSave')}</button>
        <button disabled={closeResponding||closeState.phase!=='confirm'} onClick={()=>void respondClose('discard')}>{t('closeDiscard')}</button>
      </div>
    </Dialog>}

    {modal === 'extensions' && <Dialog title={t('extensions')} closeLabel={t('close')} onClose={() => setModal(null)}>
      <p>{t('trusted')}</p>
      <div className="dialog-actions">
        <button className="primary" disabled={working} onClick={() => void run(async () => {
          const id = await window.studio.install();
          if (id) setStatus(`${id}: ${t('restart')}`);
        })}>{t('install')}</button>
        <button onClick={() => void run(() => window.studio.extensionFolder())}>{t('folder')}</button>
      </div>
      <p className="caption">{t('safe')}</p>
      {registry.panels.filter(panel => !['canvas','layers','properties','panel-manager','objects'].includes(panel.id)).map(panel => <div className="extension-row" key={panel.id}>{panel.label[language]}</div>)}
    </Dialog>}

    {modal === 'recovery' && <Dialog title={t('recovery')} closeLabel={t('close')} onClose={() => setModal(null)}>
      <p>{t('recoveryIntro')}</p>
      {recoveries.length === 0 && <div className="empty-state"><p>{t('noDrafts')}</p></div>}
      <div className="recovery-list">{recoveries.map(info => <article className="recovery-card" key={info.id}>
        <h3>{info.name}</h3>
        <time dateTime={info.updatedAt}>{new Date(info.updatedAt).toLocaleString(language)}</time>
        <p title={info.origin ?? undefined}>{info.origin ?? t('unsavedProject')}</p>
        <div className="actions">
          <button className="primary" disabled={working} onClick={() => void run(async () => {
            if (await window.studio.restoreDraft(info.id)) { setWelcome(false); setModal(null); }
          })}>{t('restore')}</button>
          <button className="quiet-button" disabled={working} onClick={() => void run(async () => {
            await window.studio.dismissDraft(info.id);
            setRecoveries(await window.studio.recoveries());
          })}>{t('dismiss')}</button>
        </div>
      </article>)}</div>
    </Dialog>}
  </main>;
}
