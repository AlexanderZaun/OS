import {useEffect, useRef, useState} from 'react';
import type {KeyboardEvent, PointerEvent} from 'react';
import {clampScale as clamp,zoomAt,frameCamera,type FrameBounds} from '../../../core/geometry/viewport';
type View={mode:'fit'|'manual';scale:number;x:number;y:number};
const initial:View={mode:'fit',scale:1,x:0,y:0};

// Viewport belongs to a panel, not the scene: navigation never changes project data/history.
export function useViewport(width:number,height:number,projectId:string) {
  const stage=useRef<HTMLDivElement>(null);
  const [bounds,setBounds]=useState({width:0,height:0});
  const [stored,setStored]=useState<View>(initial);
  const [space,setSpace]=useState(false),[dragging,setDragging]=useState(false);
  const [hand,setHand]=useState(false);
  const spaceHeld=useRef(false);
  const navigationLocked=useRef(false);
  const drag=useRef<{pointerId:number;clientX:number;clientY:number;x:number;y:number;scale:number}|null>(null);
  const touches=useRef(new Map<number,{x:number;y:number}>());
  const pinch=useRef<{view:View;distance:number;point:{x:number;y:number}}|null>(null),origin=useRef<View|null>(null);
  const fitScale=clamp(Math.min(Math.max(1,bounds.width-48)/width,Math.max(1,bounds.height-48)/height));
  const view=stored.mode==='fit'?{...initial,scale:fitScale}:stored;
  const current=useRef(view);current.current=view;
  function commit(updated:View){current.current=updated;setStored(updated);}
  function stopGesture(restore=false){
    const ids=[...touches.current.keys(),...(drag.current?[drag.current.pointerId]:[])];
    const previous=origin.current;drag.current=null;pinch.current=null;touches.current.clear();origin.current=null;setDragging(false);
    if(restore&&previous)commit(previous);
    for(const id of new Set(ids))if(stage.current?.hasPointerCapture(id))stage.current.releasePointerCapture(id);
  }
  const fit=()=>{stopGesture();current.current={...initial,scale:fitScale};setStored(initial);};
  const center=()=>{stopGesture();commit({...current.current,mode:'manual',x:0,y:0});};
  function frame(box:FrameBounds){const camera=frameCamera(box,bounds,{width,height});if(camera){stopGesture();commit({mode:'manual',...camera});}}
  function zoom(scale:number,point={x:0,y:0}) {
    commit({mode:'manual',...zoomAt(current.current,scale,point)});
  }
  useEffect(()=>{
    const element=stage.current!;
    const observer=new ResizeObserver(entries=>{
      const {width,height}=entries[0].contentRect;setBounds({width,height});
    });observer.observe(element);return()=>observer.disconnect();
  },[]);
  useEffect(()=>{fit();spaceHeld.current=false;setSpace(false);setHand(false);},[width,height,projectId]);
  useEffect(()=>{if(drag.current||pinch.current)stopGesture();},[bounds.width,bounds.height]);
  useEffect(()=>{
    const element=stage.current!;
    function wheel(event:WheelEvent){
      event.preventDefault();if(drag.current||pinch.current||navigationLocked.current)return;
      const rect=element.getBoundingClientRect();
      const unit=event.deltaMode===1?16:event.deltaMode===2?rect.height:1;
      if(event.shiftKey){const previous=current.current;commit({...previous,mode:'manual',x:previous.x-(event.deltaX||event.deltaY)*unit});return;}
      const delta=event.deltaY*unit;
      if(delta===0)return;
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
    function blur(){releaseSpace();stopGesture();}
    element.addEventListener('wheel',wheel,{passive:false});
    window.addEventListener('keydown',keydown);window.addEventListener('keyup',keyup);window.addEventListener('blur',blur);
    return()=>{element.removeEventListener('wheel',wheel);window.removeEventListener('keydown',keydown);window.removeEventListener('keyup',keyup);window.removeEventListener('blur',blur);};
  },[]);
  function onPointerDown(event:PointerEvent<HTMLDivElement>){
    if(navigationLocked.current){event.preventDefault();return;}
    if(event.button!==1&&!(event.button===0&&(hand||spaceHeld.current||event.pointerType==='touch')))return;
    if(event.pointerType==='touch'&&touches.current.size>=2){event.preventDefault();return;}
    event.preventDefault();event.currentTarget.focus({preventScroll:true});
    event.currentTarget.setPointerCapture(event.pointerId);
    if(!origin.current)origin.current={...current.current};
    if(event.pointerType==='touch'){
      touches.current.set(event.pointerId,{x:event.clientX,y:event.clientY});
      if(touches.current.size>=2){
        const [a,b]=[...touches.current.values()],rect=stage.current!.getBoundingClientRect();
        pinch.current={view:{...current.current},distance:Math.max(1,Math.hypot(a.x-b.x,a.y-b.y)),point:{x:(a.x+b.x)/2-rect.left-rect.width/2,y:(a.y+b.y)/2-rect.top-rect.height/2}};
        drag.current=null;setDragging(true);return;
      }
    }
    drag.current={pointerId:event.pointerId,clientX:event.clientX,clientY:event.clientY,...current.current};
    setDragging(true);
  }
  function onPointerMove(event:PointerEvent<HTMLDivElement>){
    if(touches.current.has(event.pointerId))touches.current.set(event.pointerId,{x:event.clientX,y:event.clientY});
    if(pinch.current){
      const [a,b]=[...touches.current.values()];if(!a||!b)return;
      const start=pinch.current,rect=stage.current!.getBoundingClientRect();
      const camera=zoomAt(start.view,start.view.scale*Math.hypot(a.x-b.x,a.y-b.y)/start.distance,start.point);
      commit({mode:'manual',...camera,x:camera.x+(a.x+b.x)/2-rect.left-rect.width/2-start.point.x,y:camera.y+(a.y+b.y)/2-rect.top-rect.height/2-start.point.y});return;
    }
    const start=drag.current;if(!start||start.pointerId!==event.pointerId)return;
    const updated:View={mode:'manual',scale:start.scale,x:start.x+event.clientX-start.clientX,y:start.y+event.clientY-start.clientY};
    current.current=updated;setStored(updated);
  }
  function onPointerEnd(event:PointerEvent<HTMLDivElement>){
    if(drag.current?.pointerId!==event.pointerId&&!touches.current.has(event.pointerId))return;
    if(event.type==='pointercancel'){stopGesture();return;}
    if(event.type==='pointerup')onPointerMove(event);
    touches.current.delete(event.pointerId);pinch.current=null;
    const remaining=[...touches.current.entries()][0];
    if(remaining){const [pointerId,point]=remaining;drag.current={pointerId,clientX:point.x,clientY:point.y,...current.current};}
    else{drag.current=null;origin.current=null;setDragging(false);}
    if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function onKeyDown(event:KeyboardEvent<HTMLDivElement>){
    if(event.target!==event.currentTarget||navigationLocked.current||event.ctrlKey||event.metaKey||event.altKey)return;
    if(event.key==='Escape'&&(drag.current||pinch.current)){event.preventDefault();stopGesture(true);return;}
    if(drag.current||pinch.current)return;
    if(event.code==='Space'){event.preventDefault();spaceHeld.current=true;setSpace(true);}
    else if(event.key==='+'||event.key==='='){event.preventDefault();zoom(current.current.scale*1.25);}
    else if(event.key==='-'){event.preventDefault();zoom(current.current.scale/1.25);}
    else if(event.key==='Home'){event.preventDefault();fit();}
    else if(event.key==='1'){event.preventDefault();zoom(1);}
    else if(event.key.toLowerCase()==='h'){event.preventDefault();setHand(value=>!value);}
    else if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){
      event.preventDefault();const step=event.shiftKey?160:40,previous=current.current;
      commit({...previous,mode:'manual',x:previous.x+(event.key==='ArrowLeft'?step:event.key==='ArrowRight'?-step:0),y:previous.y+(event.key==='ArrowUp'?step:event.key==='ArrowDown'?-step:0)});
    }
  }
  return {stage,view,fitScale,zoom,fit,frame,center,hand,toggleHand:()=>setHand(value=>!value),dragging,space,navigationLocked,handlers:{onPointerDown,onPointerMove,onPointerUp:onPointerEnd,onPointerCancel:onPointerEnd,onLostPointerCapture:onPointerEnd,onKeyDown}};
}
