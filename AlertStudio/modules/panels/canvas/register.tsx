import { useEffect, useRef, useState } from 'react';
import type { PanelProps, UiHost } from '../../../sdk/ui';
import { CanvasBackend } from '../../../adapters/render-canvas2d';
import { translator } from '../../../locales/platform';
export function CanvasPanel(props:PanelProps) {
  const canvas=useRef<HTMLCanvasElement>(null),latest=useRef(props),[playing,setPlaying]=useState(false),[time,setTime]=useState(0); latest.current=props;
  const t=translator(props.language);
  useEffect(()=>{
    const backend=new CanvasBackend(canvas.current!);let raf=0,last=0,current=time;
    function frame(now:number){if(playing&&last)current+=(now-last)/1000;last=now;
      const {snapshot,effects}=latest.current;
      backend.render(snapshot.project.objects.filter(o=>o.visible).flatMap(o=>effects.find(e=>e.id===o.type&&e.version===snapshot.project.modules[o.type])?.evaluate(o.settings,current)??[]));
      raf=requestAnimationFrame(frame);
    }raf=requestAnimationFrame(frame);return()=>{cancelAnimationFrame(raf);backend.dispose();};
  },[playing,time]);
  return <div className="canvas-panel"><div className="canvas-tools"><button onClick={()=>setPlaying(!playing)}>{t(playing?'pause':'play')}</button><label>t <input aria-label={t('time')} type="number" min="0" max="120" step="0.1" value={time} onChange={e=>{setPlaying(false);setTime(Number(e.target.value));}}/> s</label><span>{props.snapshot.project.width} × {props.snapshot.project.height}</span></div>
    <div className="canvas-stage"><canvas ref={canvas} width={props.snapshot.project.width} height={props.snapshot.project.height} style={{background:props.snapshot.project.background==='transparent'?undefined:props.snapshot.project.background}}/></div>
    <div className="canvas-caption">{t('check')}</div></div>;
}
export function register(host:UiHost){host.registerPanel({id:'canvas',label:{ru:'Холст',en:'Canvas'},component:CanvasPanel});}
