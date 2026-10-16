import * as React from 'react';
import type { Effect } from '../../sdk';
import type { Panel, UiHost, RuntimeModule } from '../../sdk/ui';
export class Registry {
  panels:Panel[]=[]; effects:Effect[]=[]; diagnostics:string[]=[]; private dispose:(()=>void)[]=[];
  private host:UiHost={React,registerPanel:p=>{if(this.panels.some(x=>x.id===p.id))throw Error('Duplicate panel');this.panels.push(p);},registerEffect:e=>{if(this.effects.some(x=>x.id===e.id))throw Error('Duplicate effect');this.effects.push(e);}};
  add(module:RuntimeModule){const p=this.panels.length,e=this.effects.length;try{const d=module.register(this.host);if(d)this.dispose.push(d);}catch(error){this.panels.length=p;this.effects.length=e;throw error;}}
  async external(){for(const installed of await window.studio.extensions()){
    try {const before=this.effects.length; const module=await import(/* @vite-ignore */ installed.url) as RuntimeModule;this.add(module);
      for(const effect of this.effects.slice(before)){const {evaluate,...definition}=effect;await window.studio.defineEffect(definition);}
    } catch(error){this.diagnostics.push(`${installed.manifest.id}: ${String(error)}`);}
  }}
  shutdown(){for(const d of this.dispose.reverse())d();this.dispose=[];}
}
