import * as React from 'react';
import type { Effect } from '../../sdk';
import type { Panel, UiHost, RuntimeModule } from '../../sdk/ui';
import type { CanvasRendererFactory } from '../../sdk/canvas2d';
export class Registry {
  panels:Panel[]=[]; effects:Effect[]=[]; canvasRenderers:CanvasRendererFactory[]=[]; diagnostics:string[]=[]; private dispose:(()=>void)[]=[];
  private host:UiHost={React,registerPanel:p=>{if(this.panels.some(x=>x.id===p.id))throw Error('Duplicate panel');this.panels.push(p);},registerEffect:e=>{if(this.effects.some(x=>x.id===e.id))throw Error('Duplicate effect');this.effects.push(e);},registerCanvasRenderer:f=>{if(this.canvasRenderers.some(x=>x.kind===f.kind))throw Error('Duplicate Canvas renderer');this.canvasRenderers.push(f);}};
  add(module:RuntimeModule){const p=this.panels.length,e=this.effects.length,r=this.canvasRenderers.length;try{const d=module.register(this.host);if(d)this.dispose.push(d);}catch(error){this.panels.length=p;this.effects.length=e;this.canvasRenderers.length=r;throw error;}}
  async external(){for(const installed of await window.studio.extensions()){
    try {const before=this.effects.length; const module=await import(/* @vite-ignore */ installed.url) as RuntimeModule;this.add(module);
      for(const effect of this.effects.slice(before)){const {evaluate,editor,...definition}=effect;await window.studio.defineEffect(definition);}
    } catch(error){this.diagnostics.push(`${installed.manifest.id}: ${String(error)}`);}
  }}
  shutdown(){for(const d of this.dispose.reverse())d();this.dispose=[];}
}
