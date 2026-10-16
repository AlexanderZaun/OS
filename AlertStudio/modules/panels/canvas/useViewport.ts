import {useEffect, useRef, useState} from 'react';
import type {KeyboardEvent, PointerEvent} from 'react';

const MIN_SCALE=.01, MAX_SCALE=8;
const clamp=(value:number)=>Math.min(MAX_SCALE,Math.max(MIN_SCALE,value));
type View={mode:'fit'|'manual';scale:number;x:number;y:number};
const initial:View={mode:'fit',scale:1,x:0,y:0};

// Viewport belongs to a panel, not the scene: navigation never changes project data/history.
export function useViewport(width:number,height:number,projectId:string) {
  const stage=useRef<HTMLDivElement>(null);
  const [bounds,setBounds]=useState({width:0,height:0});
  const [stored,setStored]=useState<View>(initial);
  const [space,setSpace]=useState(false),[dragging,setDragging]=useState(false);
  const spaceHeld=useRef(false);
  const navigationLocked=useRef(false);
  const drag=useRef<{pointerId:number;clientX:number;clientY:number;x:number;y:number;scale:number}|null>(null);
  const fitScale=clamp(Math.min(Math.max(1,bounds.width-48)/width,Math.max(1,bounds.height-48)/height));
  const view=stored.mode==='fit'?{...initial,scale:fitScale}:stored;
  const current=useRef(view);current.current=view;
  const fit=()=>{drag.current=null;setDragging(false);setStored(initial);};
  function zoom(scale:number,point={x:0,y:0}) {
    const previous=current.current,next=clamp(scale);
    const updated:View={mode:'manual',scale:next,
      x:point.x-(point.x-previous.x)*next/previous.scale,
      y:point.y-(point.y-previous.y)*next/previous.scale};
    current.current=updated;setStored(updated);
  }
  useEffect(()=>{
    const element=stage.current!;
    const observer=new ResizeObserver(entries=>{
      const {width,height}=entries[0].contentRect;setBounds({width,height});
    });observer.observe(element);return()=>observer.disconnect();
  },[]);
  useEffect(()=>{fit();spaceHeld.current=false;setSpace(false);},[width,height,projectId]);
  useEffect(()=>{
    const element=stage.current!;
    function wheel(event:WheelEvent){
      event.preventDefault();if(drag.current||navigationLocked.current)return;
      const rect=element.getBoundingClientRect();
      const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?rect.height:1);
      zoom(current.current.scale*Math.exp(-Math.max(-200,Math.min(200,delta))*.0025),
        {x:event.clientX-rect.left-rect.width/2,y:event.clientY-rect.top-rect.height/2});
    }
    function releaseSpace(){spaceHeld.current=false;setSpace(false);}
    function keydown(event:globalThis.KeyboardEvent){
      if(event.code!=='Space'||event.defaultPrevented)return;
      const target=event.target;
      if(target instanceof HTMLElement&&(target.isContentEditable||target.closest('input,textarea,select,[contenteditable="true"]')))return;
      const hovered=document.querySelector('.canvas-stage:hover');
      if(hovered?hovered!==element:document.activeElement!==element)return;
      event.preventDefault();element.focus({preventScroll:true});spaceHeld.current=true;setSpace(true);
    }
    function keyup(event:globalThis.KeyboardEvent){if(event.code==='Space')releaseSpace();}
    function blur(){releaseSpace();drag.current=null;setDragging(false);}
    element.addEventListener('wheel',wheel,{passive:false});
    window.addEventListener('keydown',keydown);window.addEventListener('keyup',keyup);window.addEventListener('blur',blur);
    return()=>{element.removeEventListener('wheel',wheel);window.removeEventListener('keydown',keydown);window.removeEventListener('keyup',keyup);window.removeEventListener('blur',blur);};
  },[]);
  function onPointerDown(event:PointerEvent<HTMLDivElement>){
    if(navigationLocked.current){event.preventDefault();return;}
    if(event.button!==1&&!(event.button===0&&(spaceHeld.current||event.pointerType==='touch')))return;
    event.preventDefault();event.currentTarget.focus({preventScroll:true});
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current={pointerId:event.pointerId,clientX:event.clientX,clientY:event.clientY,...current.current};
    setDragging(true);
  }
  function onPointerMove(event:PointerEvent<HTMLDivElement>){
    const start=drag.current;if(!start||start.pointerId!==event.pointerId)return;
    const updated:View={mode:'manual',scale:start.scale,x:start.x+event.clientX-start.clientX,y:start.y+event.clientY-start.clientY};
    current.current=updated;setStored(updated);
  }
  function onPointerEnd(event:PointerEvent<HTMLDivElement>){
    if(drag.current?.pointerId!==event.pointerId)return;
    drag.current=null;setDragging(false);
    if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function onKeyDown(event:KeyboardEvent<HTMLDivElement>){
    if(event.target!==event.currentTarget||navigationLocked.current)return;
    if(event.code==='Space'){event.preventDefault();spaceHeld.current=true;setSpace(true);}
    else if(event.key==='+'||event.key==='='){event.preventDefault();zoom(current.current.scale*1.25);}
    else if(event.key==='-'){event.preventDefault();zoom(current.current.scale/1.25);}
    else if(event.key==='Home'){event.preventDefault();fit();}
    else if(event.key==='1'){event.preventDefault();zoom(1);}
  }
  return {stage,view,fitScale,zoom,fit,dragging,space,navigationLocked,handlers:{onPointerDown,onPointerMove,onPointerUp:onPointerEnd,onPointerCancel:onPointerEnd,onLostPointerCapture:onPointerEnd,onKeyDown}};
}
