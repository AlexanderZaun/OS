import { useEffect, useRef, useState } from 'react';
import type { PanelProps, UiHost } from '../../../sdk/ui';
import { CanvasBackend } from '../../../adapters/render-canvas2d';
import { translator } from '../../../locales/platform';
import { useViewport } from './useViewport';
import { useObjectEditing } from './useObjectEditing';
export function CanvasPanel(props:PanelProps) {
  const canvas=useRef<HTMLCanvasElement>(null),latest=useRef(props),[playing,setPlaying]=useState(false),[time,setTime]=useState(0); latest.current=props;
  const clock=useRef({time:0,playing:false,last:0,labelAt:0});
  function togglePlayback(){const state=clock.current;state.playing=!state.playing;state.last=0;setPlaying(state.playing);setTime(Number(state.time.toFixed(2)));}
  function seek(value:number){if(!Number.isFinite(value))return;const state=clock.current;state.playing=false;state.time=Math.max(0,Math.min(Number.MAX_SAFE_INTEGER,value));state.last=0;setPlaying(false);setTime(state.time);}
  const t=translator(props.language);
  const {project}=props.snapshot;
  const viewport=useViewport(project.width,project.height,project.id);
  const editing=useObjectEditing(props,canvas,viewport);
  latest.current={...props,snapshot:{...props.snapshot,project:{...project,objects:editing.objects}}};
  const presets=[.25,.5,1,2,4,8],scale=viewport.view.scale;
  useEffect(()=>{seek(0);},[project.id]);
  useEffect(()=>{
    const backend=new CanvasBackend(canvas.current!,latest.current.canvasRenderers);let raf=0;
    let renderedObjects:unknown=null,renderedTime=-1,renderedWidth=-1,renderedHeight=-1;
    function frame(now:number){const state=clock.current;if(state.playing&&state.last)state.time+=(now-state.last)/1000;state.last=now;
      if(state.playing&&now-state.labelAt>=100){state.labelAt=now;setTime(Number(state.time.toFixed(2)));}
      const {snapshot,effects}=latest.current;
      if(renderedObjects!==snapshot.project.objects||renderedTime!==state.time||renderedWidth!==snapshot.project.width||renderedHeight!==snapshot.project.height){
        backend.render(snapshot.project.objects.filter(o=>o.visible).flatMap(o=>(effects.find(e=>e.id===o.type&&e.version===snapshot.project.modules[o.type])?.evaluate(o.settings,state.time)??[]).map(p=>({...p,ownerId:o.id}))));
        renderedObjects=snapshot.project.objects;renderedTime=state.time;renderedWidth=snapshot.project.width;renderedHeight=snapshot.project.height;
      }
      raf=requestAnimationFrame(frame);
    }raf=requestAnimationFrame(frame);return()=>{cancelAnimationFrame(raf);backend.dispose();};
  },[]);
  return <div className="canvas-panel"><div className="canvas-tools"><button onClick={togglePlayback}>{t(playing?'pause':'play')}</button><label>t <input aria-label={t('time')} type="number" min="0" step="0.1" value={time} onChange={e=>seek(Number(e.target.value))}/> s</label>
    <div className="canvas-zoom-controls" role="group" aria-label={t('zoom')}>
      <button aria-label={t('zoomOut')} title={t('zoomOut')} disabled={scale<=.01} onClick={()=>viewport.zoom(scale/1.25)}>−</button>
      <select aria-label={t('zoom')} value={viewport.view.mode==='fit'?'fit':String(scale)} onChange={e=>e.target.value==='fit'?viewport.fit():viewport.zoom(Number(e.target.value))}>
        <option value="fit">{t('fit')} · {Math.round(viewport.fitScale*100)}%</option>
        {viewport.view.mode==='manual'&&!presets.includes(scale)&&<option value={String(scale)}>{Math.round(scale*100)}%</option>}
        {presets.map(value=><option key={value} value={String(value)}>{value*100}%</option>)}
      </select>
      <button aria-label={t('zoomIn')} title={t('zoomIn')} disabled={scale>=8} onClick={()=>viewport.zoom(scale*1.25)}>+</button>
      <button aria-pressed={viewport.view.mode==='fit'} onClick={viewport.fit}>{t('fit')}</button>
    </div><span>{project.width} × {project.height}</span></div>
    <div ref={viewport.stage} className="canvas-stage" tabIndex={0} role="region" aria-label={t('canvasViewport')}
      data-navigation={viewport.dragging?'dragging':viewport.space?'pan':editing.moving?'moving':'idle'}
      onPointerDown={e=>{viewport.handlers.onPointerDown(e);editing.handlers.onPointerDown(e);}}
      onPointerMove={e=>{viewport.handlers.onPointerMove(e);editing.handlers.onPointerMove(e);}}
      onPointerUp={e=>{editing.handlers.onPointerUp(e);viewport.handlers.onPointerUp(e);}}
      onPointerCancel={e=>{editing.handlers.onPointerCancel(e);viewport.handlers.onPointerCancel(e);}}
      onLostPointerCapture={e=>{editing.handlers.onLostPointerCapture(e);viewport.handlers.onLostPointerCapture(e);}}
      onKeyDown={e=>{editing.handlers.onKeyDown(e);if(!e.defaultPrevented)viewport.handlers.onKeyDown(e);}}>
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
