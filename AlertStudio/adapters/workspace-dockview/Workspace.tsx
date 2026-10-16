import { createContext, useContext, useEffect, useRef } from 'react';
import { DockviewReact, type DockviewApi, type IDockviewPanelProps } from 'dockview-react';
import 'dockview-react/dist/styles/dockview.css';
import type { Panel, PanelProps } from '../../sdk/ui';
const PanelContext=createContext<{panels:Panel[];props:PanelProps}|null>(null);
function Content(p:IDockviewPanelProps<{type:string}>){const current=useContext(PanelContext)!;const panel=current.panels.find(x=>x.id===p.params.type);if(!panel)return null;const C=panel.component;return <C {...current.props}/>;}
const components={panel:Content};
export function Workspace({panels,props,instance}:{panels:Panel[];props:PanelProps;instance:number}) {
  const api=useRef<DockviewApi|null>(null);
  useEffect(()=>{for(const panel of api.current?.panels??[]){const type=panel.params?.type;const definition=panels.find(p=>p.id===type);if(definition)panel.api.setTitle(definition.label[props.language]);}},[props.language]);
  return <PanelContext.Provider value={{panels,props}}><div className="workspace"><DockviewReact key={instance} components={components} className="dockview-theme-dark studio-workspace" onReady={e=>{
    api.current=e.api;
    e.api.onDidLayoutChange(()=>localStorage.setItem('alert-studio-workspace',JSON.stringify(e.api.toJSON())));
    const saved=localStorage.getItem('alert-studio-workspace');
    if(saved){try{e.api.fromJSON(JSON.parse(saved));return;}catch(error){console.warn(error);}}
    e.api.addPanel({id:'canvas-1',component:'panel',params:{type:'canvas'},title:panels.find(p=>p.id==='canvas')!.label[props.language]});
    e.api.addPanel({id:'layers-1',component:'panel',params:{type:'layers'},title:panels.find(p=>p.id==='layers')!.label[props.language],initialWidth:340,position:{referencePanel:'canvas-1',direction:'right'}});
    e.api.addPanel({id:'properties-1',component:'panel',params:{type:'properties'},title:panels.find(p=>p.id==='properties')!.label[props.language],initialHeight:380,position:{referencePanel:'layers-1',direction:'below'}});
  }}/><div className="panel-open-buttons">{panels.map(p=><button key={p.id} onClick={()=>api.current?.addPanel({id:crypto.randomUUID(),component:'panel',params:{type:p.id},title:p.label[props.language]})}>{p.label[props.language]} +</button>)}</div></div></PanelContext.Provider>;
}
