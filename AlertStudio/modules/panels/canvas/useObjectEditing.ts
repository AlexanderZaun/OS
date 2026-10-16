import {useEffect,useMemo,useRef,useState} from 'react';
import type {PointerEvent,KeyboardEvent,RefObject} from 'react';
import type {PanelProps} from '../../../sdk/ui';
import type {ObjectBounds,Effect} from '../../../sdk';
import type {SceneObject,Value} from '../../../contracts/project';
import type {useViewport} from './useViewport';

type Preview={id:string;values:Record<string,Value>};
type Gesture={pointerId:number;revision:number;projectId:string;object:SceneObject|null;effect:Effect|null;startX:number;startY:number;scale:number;left:number;top:number;values:Record<string,Value>};
type Viewport=ReturnType<typeof useViewport>;
export function useObjectEditing(props:PanelProps,canvas:RefObject<HTMLCanvasElement|null>,viewport:Viewport){
  const latest=useRef(props);latest.current=props;
  const gesture=useRef<Gesture|null>(null),[preview,setPreview]=useState<Preview|null>(null);
  function measureText(text:string,font:string){const c=canvas.current!.getContext('2d')!;c.save();c.font=font;const width=c.measureText(text).width;c.restore();return width;}
  function bounds(object:SceneObject,effect:Effect|undefined):ObjectBounds|null{
    if(!object.visible||!effect?.editor)return null;
    const result=effect.editor.bounds(object.settings,measureText);
    if(![result.x,result.y,result.width,result.height,result.rotation??0].every(Number.isFinite)||result.width<=0||result.height<=0)return null;
    return result;
  }
  const effectFor=(object:SceneObject)=>latest.current.effects.find(e=>e.id===object.type&&e.version===latest.current.snapshot.project.modules[object.type]);
  function cancel(){gesture.current=null;viewport.navigationLocked.current=false;setPreview(null);}
  function isCurrent(start:Gesture){
    const rect=canvas.current!.getBoundingClientRect(),snapshot=latest.current.snapshot;
    return start.revision===snapshot.revision&&start.projectId===snapshot.project.id&&!latest.current.interactionPending&&
      Math.abs(rect.width/snapshot.project.width-start.scale)<.00001&&Math.abs(rect.left-start.left)<.5&&Math.abs(rect.top-start.top)<.5;
  }
  useEffect(()=>{
    const start=gesture.current;
    if(start&&(props.interactionPending||start.revision!==props.snapshot.revision||start.projectId!==props.snapshot.project.id))cancel();
  },[props.snapshot.revision,props.snapshot.project.id,props.interactionPending]);
  useEffect(()=>{window.addEventListener('blur',cancel);return()=>{window.removeEventListener('blur',cancel);viewport.navigationLocked.current=false;};},[]);
  function onPointerDown(event:PointerEvent<HTMLDivElement>){
    if(event.defaultPrevented||event.button!==0||event.pointerType==='touch'||latest.current.interactionPending)return;
    event.preventDefault();event.currentTarget.focus({preventScroll:true});
    const rect=canvas.current!.getBoundingClientRect(),project=latest.current.snapshot.project;
    const point={x:(event.clientX-rect.left)*project.width/rect.width,y:(event.clientY-rect.top)*project.height/rect.height};
    const object=[...project.objects].reverse().find(object=>{
      const box=bounds(object,effectFor(object));if(!box)return false;
      const dx=point.x-box.x,dy=point.y-box.y,angle=box.rotation??0;
      return Math.abs(dx*Math.cos(angle)+dy*Math.sin(angle))<=box.width/2&&Math.abs(-dx*Math.sin(angle)+dy*Math.cos(angle))<=box.height/2;
    })??null;
    const effect=object?effectFor(object)??null:null;
    gesture.current={pointerId:event.pointerId,revision:latest.current.snapshot.revision,projectId:project.id,object,effect,startX:event.clientX,startY:event.clientY,scale:rect.width/project.width,left:rect.left,top:rect.top,values:{}};
    viewport.navigationLocked.current=true;event.currentTarget.setPointerCapture(event.pointerId);
    setPreview(object?{id:object.id,values:{}}:null);
  }
  function onPointerMove(event:PointerEvent<HTMLDivElement>){
    const start=gesture.current;
    if(!start||start.pointerId!==event.pointerId||!start.object||!start.effect?.editor)return;
    if(!isCurrent(start)){cancel();return;}
    const dx=(event.clientX-start.startX)/start.scale,dy=(event.clientY-start.startY)/start.scale;
    if(Math.hypot(event.clientX-start.startX,event.clientY-start.startY)<3)return;
    const values:Record<string,Value>={};
    for(const [axis,delta] of [['x',dx],['y',dy]] as const){
      const key=start.effect.editor.position[axis],setting=start.effect.settings.find(s=>s.id===key);
      if(!setting||setting.type!=='number')continue;
      const step=setting.step??1,origin=setting.min??0;
      const value=origin+Math.round((Number(start.object.settings[key])+delta-origin)/step)*step;
      values[key]=Math.max(setting.min??-Infinity,Math.min(setting.max??Infinity,Number(value.toFixed(6))));
    }
    start.values=values;setPreview({id:start.object.id,values});
  }
  function onPointerUp(event:PointerEvent<HTMLDivElement>){
    const start=gesture.current;if(!start||start.pointerId!==event.pointerId)return;
    if(isCurrent(start)){
      const moved=start.object&&Object.keys(start.values).some(key=>start.values[key]!==start.object!.settings[key]);
      if(moved)latest.current.dispatch({type:'patch',id:start.object!.id,values:start.values,revision:start.revision});
      else latest.current.dispatch({type:'select',id:start.object?.id??null});
    }
    cancel();if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function onPointerCancel(event:PointerEvent<HTMLDivElement>){if(gesture.current?.pointerId===event.pointerId)cancel();}
  function onKeyDown(event:KeyboardEvent<HTMLDivElement>){if(event.key==='Escape'&&gesture.current){event.preventDefault();cancel();}}
  const objects=useMemo(()=>preview?props.snapshot.project.objects.map(object=>preview.id===object.id?{...object,settings:{...object.settings,...preview.values}}:object):props.snapshot.project.objects,[props.snapshot.project.objects,preview]);
  const selected=objects.find(o=>o.id===(preview?.id??props.snapshot.selected));
  const selection=selected&&canvas.current?bounds(selected,effectFor(selected)):null;
  return {objects,selection,moving:preview!==null,handlers:{onPointerDown,onPointerMove,onPointerUp,onPointerCancel,onLostPointerCapture:onPointerCancel,onKeyDown}};
}
