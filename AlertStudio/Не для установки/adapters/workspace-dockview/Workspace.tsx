import { createContext, useContext, useEffect, useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import { DockviewReact, type DockviewApi, type IDockviewPanelProps } from 'dockview-react';
import 'dockview-react/dist/styles/dockview.css';
import type { CanvasAction, Panel, PanelProps } from '../../sdk/ui';
const PanelContext=createContext<{panels:Panel[];props:PanelProps;register(id:string,handler:(action:CanvasAction)=>void):()=>void;activateCanvas(id:string):void}|null>(null);
function Content(p:IDockviewPanelProps<{type:string}>){
  const current=useContext(PanelContext)!;
  const registerCanvasActions=useMemo(()=>((handler:(action:CanvasAction)=>void)=>current.register(p.api.id,handler)),[current.register,p.api.id]);
  const panel=current.panels.find(x=>x.id===p.params.type);if(!panel)return null;const C=panel.component;
  return <div style={{height:'100%'}} onPointerDownCapture={()=>{if(p.params.type==='canvas')current.activateCanvas(p.api.id);}} onFocusCapture={()=>{if(p.params.type==='canvas')current.activateCanvas(p.api.id);}}><C {...current.props} registerCanvasActions={registerCanvasActions}/></div>;
}
const components={panel:Content};
export interface WorkspaceHandle {showPanels():void;show(type:string):void;add(type:string):void;canvas(action:CanvasAction):void;}
export const Workspace=forwardRef<WorkspaceHandle,{panels:Panel[];props:PanelProps;instance:number;onDetach(type:string):void}>(function Workspace({panels,props,instance,onDetach},ref) {
  const api=useRef<DockviewApi|null>(null),layoutListener=useRef<{dispose():void}|null>(null);
  const canvasHandlers=useRef(new Map<string,(action:CanvasAction)=>void>()),lastCanvas=useRef<string|null>(null),pendingCanvas=useRef<CanvasAction|null>(null);
  const register=useMemo(()=>((id:string,handler:(action:CanvasAction)=>void)=>{
    canvasHandlers.current.set(id,handler);
    if(pendingCanvas.current){const action=pendingCanvas.current;pendingCanvas.current=null;handler(action);}
    return()=>{canvasHandlers.current.delete(id);};
  }),[]);
  function open(type:string){
    const definition=panels.find(panel=>panel.id===type),current=api.current;if(!definition||!current)return;
    if(type==='objects'&&!current.panels.some(panel=>panel.params?.type===type)){
      const canvas=current.panels.find(panel=>panel.params?.type==='canvas')??current.panels[0];
      current.addPanel({id:crypto.randomUUID(),component:'panel',params:{type},title:definition.label[props.language],initialWidth:170,minimumWidth:120,
        ...(canvas?{position:{referencePanel:canvas.id,direction:'left' as const}}:{})});
      return;
    }
    if(type==='panel-manager'){
      const existing=current.panels.find(panel=>panel.params?.type===type);
      if(existing){existing.api.setActive();return;}
      const canvas=current.panels.find(panel=>panel.params?.type==='canvas')??current.panels[0];
      current.addPanel({id:crypto.randomUUID(),component:'panel',params:{type},title:definition.label[props.language],initialHeight:130,
        ...(canvas?{position:{referencePanel:canvas.id,direction:'below' as const}}:{})});
      return;
    }
    const target=current.panels.find(panel=>panel.params?.type===type)??(type==='history'?current.panels.find(panel=>panel.params?.type==='properties'):undefined)??current.panels.find(panel=>panel.params?.type!=='panel-manager');
    current.addPanel({id:crypto.randomUUID(),component:'panel',params:{type},title:definition.label[props.language],
      ...(['layers','properties','history'].includes(type)?{minimumWidth:160}:{}),
      ...(type==='history'?{initialHeight:180,minimumHeight:160}:{}),
      ...(type==='layers'?{minimumHeight:190}:{}),
      ...(type==='objects'?{minimumWidth:120}:{}),
      ...(target?{position:{referencePanel:target.id,direction:type==='history'?'within' as const:'below' as const}}:{})});
  }
  function show(type:string){const existing=api.current?.panels.find(panel=>panel.params?.type===type);if(existing)existing.api.setActive();else open(type);}
  useImperativeHandle(ref,()=>({showPanels:()=>show('panel-manager'),show,add:open,canvas:action=>{
    const current=api.current;
    const target=[current?.activePanel?.id,lastCanvas.current,...canvasHandlers.current.keys()].find(id=>id&&canvasHandlers.current.has(id));
    if(target){current?.getPanel(target)?.api.setActive();canvasHandlers.current.get(target)?.(action);}else{pendingCanvas.current=action;show('canvas');}
  }}));
  useEffect(()=>()=>layoutListener.current?.dispose(),[]);
  useEffect(()=>{for(const panel of api.current?.panels??[]){const type=panel.params?.type;const definition=panels.find(p=>p.id===type);if(definition)panel.api.setTitle(definition.label[props.language]);}},[props.language]);
  const contentProps:PanelProps={...props,workspace:{panels:panels.map(({id,label})=>({id,label})),open,detach:onDetach}};
  return <PanelContext.Provider value={{panels,props:contentProps,register,activateCanvas:id=>{lastCanvas.current=id;}}}><div className="workspace"><DockviewReact key={instance} components={components} className="dockview-theme-dark studio-workspace" onReady={e=>{
    api.current=e.api;layoutListener.current?.dispose();
    const save=()=>{try{localStorage.setItem('alert-studio-workspace',JSON.stringify(e.api.toJSON()));}catch(error){console.warn(error);}};
    let restored=false,saved:string|null=null;
    try{saved=localStorage.getItem('alert-studio-workspace');}catch{}
    if(saved){try{e.api.fromJSON(JSON.parse(saved));restored=true;}catch(error){console.warn(error);e.api.clear();}}
    if(!restored){
      e.api.addPanel({id:'canvas-1',component:'panel',params:{type:'canvas'},title:panels.find(p=>p.id==='canvas')!.label[props.language]});
      e.api.addPanel({id:'layers-1',component:'panel',params:{type:'layers'},title:panels.find(p=>p.id==='layers')!.label[props.language],initialWidth:300,minimumWidth:160,minimumHeight:190,position:{referencePanel:'canvas-1',direction:'right'}});
      e.api.addPanel({id:'properties-1',component:'panel',params:{type:'properties'},title:panels.find(p=>p.id==='properties')!.label[props.language],initialHeight:380,minimumWidth:160,position:{referencePanel:'layers-1',direction:'below'}});
    }
    // Add the new controls once when upgrading a saved layout, but respect later user closure.
    let catalogMigrated=false;try{catalogMigrated=localStorage.getItem('alert-studio-object-catalog-v1')==='true';}catch{}
    if(!restored||!catalogMigrated){if(!e.api.panels.some(panel=>panel.params?.type==='objects'))open('objects');}
    try{localStorage.setItem('alert-studio-object-catalog-v1','true');}catch{}
    // The manager is optional. Restore existing user layouts without injecting it.
    for(const panel of e.api.panels){
      if(panel.params?.type==='layers')panel.api.setConstraints({minimumWidth:160,minimumHeight:190});
      if(panel.params?.type==='properties')panel.api.setConstraints({minimumWidth:160});
      if(panel.params?.type==='objects')panel.api.setConstraints({minimumWidth:120});
      if(panel.params?.type==='history')panel.api.setConstraints({minimumWidth:160,minimumHeight:160});
    }
    layoutListener.current=e.api.onDidLayoutChange(save);save();
  }}/></div></PanelContext.Provider>;
});
