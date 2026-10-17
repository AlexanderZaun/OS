import { useEffect, useRef, useState } from 'react';
import type { PanelProps, UiHost } from '../../../sdk/ui';
import { CanvasBackend } from '../../../adapters/render-canvas2d';
import { translator } from '../../../locales/platform';
import { useViewport } from './useViewport';
import { useObjectEditing } from './useObjectEditing';
import {usePlayback} from './usePlayback';
import {playbackTime} from '../../../contracts/playback';
import {evaluateScene} from '../../../core/scene/evaluate';
import type {SceneDiagnostic} from '../../../core/scene/evaluate';
import {parseZoomPercent} from '../../../core/geometry/viewport';
export function CanvasPanel(props:PanelProps) {
  const canvas=useRef<HTMLCanvasElement>(null),latest=useRef(props),[time,setTime]=useState(0),[diagnostics,setDiagnostics]=useState<SceneDiagnostic[]>([]); latest.current=props;
  const playback=usePlayback(),playing=playback.state.playing;
  function togglePlayback(){playback.command({type:'toggle'});}
  function seek(value:number){if(Number.isFinite(value))playback.command({type:'seek',time:Math.max(0,Math.min(Number.MAX_SAFE_INTEGER,value))});}
  const t=translator(props.language);
  const {project}=props.snapshot;
  const viewport=useViewport(project.width,project.height,project.id);
  const editing=useObjectEditing(props,canvas,viewport);
  latest.current={...props,snapshot:{...props.snapshot,project:{...project,objects:editing.objects}}};
  const presets=[.01,.05,.1,.125,.25,.5,1,2,4,8],scale=viewport.view.scale;
  const percent=(value:number)=>String(Number((value*100).toFixed(2)));
  const [zoomText,setZoomText]=useState(percent(scale));
  useEffect(()=>setZoomText(percent(scale)),[scale]);
  function applyZoom(){if(zoomText===percent(scale))return;const value=parseZoomPercent(zoomText);if(value!==null&&value!==scale)viewport.zoom(value);setZoomText(percent(value??scale));}
  useEffect(()=>{setTime(Number(playbackTime(playback.state,Date.now()).toFixed(2)));},[playback.state.revision]);
  useEffect(()=>{
    const backend=new CanvasBackend(canvas.current!,latest.current.canvasRenderers);let raf=0;
    let renderedObjects:unknown=null,renderedTime=-1,renderedWidth=-1,renderedHeight=-1,lastLabel=0,diagnosticKey='';
    function frame(now:number){const state=playback.latest.current,current=playbackTime(state,Date.now());
      if(state.playing&&now-lastLabel>=100){lastLabel=now;setTime(Number(current.toFixed(2)));}
      const {snapshot,effects}=latest.current;
      if(renderedObjects!==snapshot.project.objects||renderedTime!==current||renderedWidth!==snapshot.project.width||renderedHeight!==snapshot.project.height){
        const scene=evaluateScene(snapshot.project,effects,current);backend.render(scene.primitives);
        const key=JSON.stringify(scene.diagnostics);if(key!==diagnosticKey){diagnosticKey=key;setDiagnostics(scene.diagnostics);}
        renderedObjects=snapshot.project.objects;renderedTime=current;renderedWidth=snapshot.project.width;renderedHeight=snapshot.project.height;
      }
      raf=requestAnimationFrame(frame);
    }raf=requestAnimationFrame(frame);return()=>{cancelAnimationFrame(raf);backend.dispose();};
  },[]);
  return <div className="canvas-panel"><div className="canvas-tools">
    <div className="canvas-zoom-controls" role="group" aria-label={t('zoom')}>
      <button aria-label={t('zoomOut')} title={t('zoomOut')} disabled={scale<=.01} onClick={()=>viewport.zoom(scale/1.25)}>−</button>
      <select aria-label={t('zoom')} value={viewport.view.mode==='fit'?'fit':String(scale)} onChange={e=>e.target.value==='fit'?viewport.fit():viewport.zoom(Number(e.target.value))}>
        <option value="fit">{t('fit')} · {Math.round(viewport.fitScale*100)}%</option>
        {viewport.view.mode==='manual'&&!presets.includes(scale)&&<option value={String(scale)}>{Math.round(scale*100)}%</option>}
        {presets.map(value=><option key={value} value={String(value)}>{value*100}%</option>)}
      </select>
      <button aria-label={t('zoomIn')} title={t('zoomIn')} disabled={scale>=8} onClick={()=>viewport.zoom(scale*1.25)}>+</button>
      <label className="canvas-zoom-entry" title={t('zoomValueHint')}><input aria-label={t('zoomValue')} inputMode="decimal" value={zoomText} onChange={e=>setZoomText(e.target.value)} onBlur={applyZoom} onKeyDown={e=>{
        if(e.key==='Enter'){e.preventDefault();applyZoom();}
        if(e.key==='Escape'){e.preventDefault();setZoomText(percent(scale));}
      }}/> %</label>
      <button aria-pressed={viewport.view.mode==='fit'} onClick={viewport.fit}>{t('fit')}</button>
    </div><div className="canvas-view-controls" role="group" aria-label={t('canvasViewport')}>
      <button aria-label={t('frameSelection')} title={t('frameSelection')+' (F)'} disabled={!editing.selection||editing.moving} onClick={()=>{if(editing.selection)viewport.frame(editing.selection);}}><span className="canvas-view-full">{t('frameSelection')}</span><span className="canvas-view-short">{t('frameSelectionShort')}</span></button>
      <button aria-label={t('centerCanvas')} title={t('centerCanvas')} onClick={viewport.center}><span className="canvas-view-full">{t('centerCanvas')}</span><span className="canvas-view-short">{t('centerCanvasShort')}</span></button>
      <button aria-pressed={viewport.hand} title={t('handToolHint')} onClick={()=>{viewport.toggleHand();viewport.stage.current?.focus({preventScroll:true});}}>{t('handTool')}</button>
    </div><div className="canvas-playback-controls"><button onClick={togglePlayback}>{t(playing?'pause':'play')}</button><label>t <input aria-label={t('time')} type="number" min="0" step="0.1" value={time} onChange={e=>seek(Number(e.target.value))}/> s</label>
    <label><input type="checkbox" aria-label={t('loop')} checked={playback.state.loop} onChange={e=>playback.command({type:'configure',duration:playback.state.duration,loop:e.target.checked,speed:playback.state.speed})}/>{t('loop')}</label>
    <label title={t('duration')}>{t('period')} <input aria-label={t('duration')} type="number" min="1" max="3600" value={playback.state.duration} onChange={e=>{const duration=Number(e.target.value);if(duration>=1&&duration<=3600)playback.command({type:'configure',duration,loop:playback.state.loop,speed:playback.state.speed});}}/> s</label>
    <label title={t('playbackSpeed')}>× <input aria-label={t('playbackSpeed')} type="number" min="0" max="4" step="0.1" value={playback.state.speed} onChange={e=>{const speed=Number(e.target.value);if(speed>=0&&speed<=4)playback.command({type:'configure',duration:playback.state.duration,loop:playback.state.loop,speed});}}/></label>
    <span className="canvas-dimensions">{project.width} × {project.height}</span></div></div>
    {(diagnostics.length>0||playback.error)&&<div className="canvas-diagnostics" role="status">{playback.error?t('effectProblem'):diagnostics.map(d=>`${t(d.code==='missing-mask'?'maskProblem':d.code==='limit'?'limitProblem':d.code==='cycle'?'cycleProblem':d.code==='missing-source'||d.code==='wrong-source'||d.code==='inactive-source'?'sourceProblem':'effectProblem')}: ${project.objects.find(o=>o.id===d.objectId)?.name??d.objectId}`).join(' · ')}</div>}
    <div ref={viewport.stage} className="canvas-stage" tabIndex={0} role="region" aria-label={t('canvasViewport')}
      data-navigation={viewport.dragging?'dragging':viewport.space||viewport.hand?'pan':editing.moving?'moving':'idle'}
      onPointerDown={e=>{viewport.handlers.onPointerDown(e);editing.handlers.onPointerDown(e);}}
      onPointerMove={e=>{viewport.handlers.onPointerMove(e);editing.handlers.onPointerMove(e);}}
      onPointerUp={e=>{editing.handlers.onPointerUp(e);viewport.handlers.onPointerUp(e);}}
      onPointerCancel={e=>{editing.handlers.onPointerCancel(e);viewport.handlers.onPointerCancel(e);}}
      onLostPointerCapture={e=>{editing.handlers.onLostPointerCapture(e);viewport.handlers.onLostPointerCapture(e);}}
      onKeyDown={e=>{editing.handlers.onKeyDown(e);if(!e.defaultPrevented)viewport.handlers.onKeyDown(e);
        if(!e.defaultPrevented&&e.target===e.currentTarget&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&e.key.toLowerCase()==='f'&&!viewport.navigationLocked.current&&editing.selection){e.preventDefault();viewport.frame(editing.selection);}
      }}>
      <canvas ref={canvas} width={project.width} height={project.height} style={{width:project.width,height:project.height,
        transform:`translate(-50%, -50%) translate(${viewport.view.x}px, ${viewport.view.y}px) scale(${scale})`,
        background:project.background==='transparent'?undefined:project.background}}/>
      {editing.selection&&<div className="canvas-selection" aria-hidden="true" style={{
        left:`calc(50% + ${viewport.view.x+(editing.selection.x-project.width/2)*scale}px)`,
        top:`calc(50% + ${viewport.view.y+(editing.selection.y-project.height/2)*scale}px)`,
        width:editing.selection.width*scale,height:editing.selection.height*scale,
        transform:`translate(-50%, -50%) rotate(${editing.selection.rotation??0}rad)`,
      }}/>}
    </div>
    <div className="canvas-caption">{t('canvasNavigation')}</div></div>;
}
export function register(host:UiHost){host.registerPanel({id:'canvas',label:{ru:'Холст',en:'Canvas'},component:CanvasPanel});}
