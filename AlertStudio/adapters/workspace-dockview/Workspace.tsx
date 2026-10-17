import { createContext, useContext, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { DockviewReact, type DockviewApi, type IDockviewPanelProps } from 'dockview-react';
import 'dockview-react/dist/styles/dockview.css';
import type { Panel, PanelProps } from '../../sdk/ui';
const PanelContext=createContext<{panels:Panel[];props:PanelProps}|null>(null);
function Content(p:IDockviewPanelProps<{type:string}>){const current=useContext(PanelContext)!;const panel=current.panels.find(x=>x.id===p.params.type);if(!panel)return null;const C=panel.component;return <C {...current.props}/>;}
const components={panel:Content};
export interface WorkspaceHandle {showPanels():void;}
export const Workspace=forwardRef<WorkspaceHandle,{panels:Panel[];props:PanelProps;instance:number;onDetach(type:string):void}>(function Workspace({panels,props,instance,onDetach},ref) {
  const api=useRef<DockviewApi|null>(null),layoutListener=useRef<{dispose():void}|null>(null);
  function open(type:string){
    const definition=panels.find(panel=>panel.id===type),current=api.current;if(!definition||!current)return;
    if(type==='objects'&&!current.panels.some(panel=>panel.params?.type===type)){
      const canvas=current.panels.find(panel=>panel.params?.type==='canvas')??current.panels[0];
      current.addPanel({id:crypto.randomUUID(),component:'panel',params:{type},title:definition.label[props.language],initialWidth:180,minimumWidth:155,
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
    const target=current.panels.find(panel=>panel.params?.type===type)??current.panels.find(panel=>panel.params?.type!=='panel-manager');
    current.addPanel({id:crypto.randomUUID(),component:'panel',params:{type},title:definition.label[props.language],
      ...(['layers','properties'].includes(type)?{minimumWidth:190}:{}),
      ...(type==='objects'?{minimumWidth:155}:{}),
      ...(target?{position:{referencePanel:target.id,direction:'below' as const}}:{})});
  }
  useImperativeHandle(ref,()=>({showPanels:()=>open('panel-manager')}));
  useEffect(()=>()=>layoutListener.current?.dispose(),[]);
  useEffect(()=>{for(const panel of api.current?.panels??[]){const type=panel.params?.type;const definition=panels.find(p=>p.id===type);if(definition)panel.api.setTitle(definition.label[props.language]);}},[props.language]);
  const contentProps:PanelProps={...props,workspace:{panels:panels.map(({id,label})=>({id,label})),open,detach:onDetach}};
  return <PanelContext.Provider value={{panels,props:contentProps}}><div className="workspace"><DockviewReact key={instance} components={components} className="dockview-theme-dark studio-workspace" onReady={e=>{
    api.current=e.api;layoutListener.current?.dispose();
    const save=()=>{try{localStorage.setItem('alert-studio-workspace',JSON.stringify(e.api.toJSON()));}catch(error){console.warn(error);}};
    let restored=false,saved:string|null=null;
    try{saved=localStorage.getItem('alert-studio-workspace');}catch{}
    if(saved){try{e.api.fromJSON(JSON.parse(saved));restored=true;}catch(error){console.warn(error);e.api.clear();}}
    if(!restored){
      e.api.addPanel({id:'canvas-1',component:'panel',params:{type:'canvas'},title:panels.find(p=>p.id==='canvas')!.label[props.language]});
      e.api.addPanel({id:'layers-1',component:'panel',params:{type:'layers'},title:panels.find(p=>p.id==='layers')!.label[props.language],initialWidth:340,minimumWidth:190,position:{referencePanel:'canvas-1',direction:'right'}});
      e.api.addPanel({id:'properties-1',component:'panel',params:{type:'properties'},title:panels.find(p=>p.id==='properties')!.label[props.language],initialHeight:380,minimumWidth:190,position:{referencePanel:'layers-1',direction:'below'}});
    }
    // Add the new controls once when upgrading a saved layout, but respect later user closure.
    let catalogMigrated=false;try{catalogMigrated=localStorage.getItem('alert-studio-object-catalog-v1')==='true';}catch{}
    if(!restored||!catalogMigrated){if(!e.api.panels.some(panel=>panel.params?.type==='objects'))open('objects');}
    try{localStorage.setItem('alert-studio-object-catalog-v1','true');}catch{}
    let migrated=false;try{migrated=localStorage.getItem('alert-studio-panel-manager-v1')==='true';}catch{}
    if(!restored||!migrated)open('panel-manager');
    try{localStorage.setItem('alert-studio-panel-manager-v1','true');}catch{}
    layoutListener.current=e.api.onDidLayoutChange(save);save();
  }}/></div></PanelContext.Provider>;
});
