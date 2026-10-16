import { useEffect, useState } from 'react';
import type { Snapshot, Command } from '../../contracts/project';
import type { RecoveryInfo, SessionStatus } from '../../contracts/recovery';
import type { Registry } from '../bootstrap/registry';
import type { Language, PanelProps } from '../../sdk/ui';
import { Workspace } from '../../adapters/workspace-dockview/Workspace';
import { Dialog } from '../../ui-kit/Dialog';
import { translator, type TranslationKey } from '../../locales/platform';

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
  const [modal, setModal] = useState<'extensions' | 'recovery' | null>(null);
  const [status, setStatus] = useState('');
  const [hasError, setHasError] = useState(false);
  const [working, setWorking] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [workspace, setWorkspace] = useState(0);
  const [session, setSession] = useState(initialSession);
  const [recoveries, setRecoveries] = useState<RecoveryInfo[]>([]);
  const [name, setName] = useState('My alert');
  const [width, setWidth] = useState(1920);
  const [height, setHeight] = useState(1080);
  const [background, setBackground] = useState('transparent');
  const t = translator(language);

  function report(error: unknown) {
    const message = String(error);
    const key = knownErrors.find(key => message.includes(key));
    setStatus(key ? t(key) : message);
    setHasError(true);
  }

  async function run(action: () => Promise<unknown>) {
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

  useEffect(() => {
    function key(event: KeyboardEvent) {
      if (modal !== null) return;
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        void run(() => window.studio.save(event.shiftKey));
      }
      if (event.ctrlKey && event.key === 'z' && !(event.target instanceof HTMLInputElement)) {
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

  return <main className={detached ? 'studio-shell detached-shell' : 'studio-shell'}>
    <header className="topbar">
      <strong><i /> ALERT<span>STUDIO</span></strong>
      <span className="project-title">{snapshot.project.name}<small>{t(snapshot.dirty ? 'dirty' : 'clean')}</small></span>
      <button className="quiet-button" onClick={() => setLanguage(language === 'ru' ? 'en' : 'ru')}>{language.toUpperCase()}</button>
    </header>

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
          {snapshot.dirty && <button onClick={() => setWelcome(false)}>{t('resume')}</button>}
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
      <nav className="toolbar">
        <button onClick={() => setWelcome(true)}>{t('new')}</button>
        <button onClick={() => void openProject()} disabled={working}>{t('open')}</button>
        <button className="primary" onClick={() => void run(() => window.studio.save())} disabled={working}>{t('save')}</button>
        <button onClick={() => void run(() => window.studio.save(true))} disabled={working}>{t('saveAs')}</button>
        <span className="divider" />
        <button disabled={!snapshot.canUndo || working} onClick={() => dispatch({type:'undo'})}>{t('undo')}</button>
        <button disabled={!snapshot.canRedo || working} onClick={() => dispatch({type:'redo'})}>{t('redo')}</button>
        <span className="toolbar-spacer" />
        <button onClick={() => void showRecovery()} disabled={working}>{t('recovery')}</button>
        <button onClick={() => { localStorage.removeItem('alert-studio-workspace'); setWorkspace(value => value + 1); }}>{t('reset')}</button>
        <button onClick={() => setModal('extensions')}>{t('extensions')}</button>
      </nav>
      {session.usedBackup && <div className="notice-banner" role="alert">{t('backupNotice')}</div>}
      {session.recovered && <div className="notice-banner" role="alert">{t('recoveredNotice')}</div>}
      <div className="editor">
        <aside className="tool-rail">
          <span className="eyebrow">{t('add')}</span>
          {registry.effects.map(effect => <button key={effect.id} onClick={() => dispatch({type:'add',effect:effect.id})}>{effect.label[language]} +</button>)}
          <span className="eyebrow section-label">{t('detach')}</span>
          {registry.panels.map(panel => <button key={panel.id} className="quiet-button" onClick={() => void run(() => window.studio.detach(panel.id))}>{panel.label[language]} ↗</button>)}
        </aside>
        <Workspace panels={registry.panels} props={props} instance={workspace} />
      </div>
    </>}

    <footer>
      <span className={hasError ? 'status-message status-error' : 'status-message'} role="status">{status || registry.diagnostics.join(' · ') || t('check')}</span>
      <span className="autosave-status" data-testid="autosave-status" data-state={session.autosave} title={session.error ?? session.folder ?? ''}>
        <i />{t(autosaveKeys[session.autosave])}{session.autosave === 'saved' && savedTime ? ` · ${savedTime}` : ''}
      </span>
    </footer>

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
      {registry.panels.filter(panel => !['canvas','layers','properties'].includes(panel.id)).map(panel => <div className="extension-row" key={panel.id}>{panel.label[language]}</div>)}
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
