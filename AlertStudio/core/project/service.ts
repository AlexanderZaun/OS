import type { Command, Project, ProjectService, Snapshot,Value } from '../../contracts/project';
import type { Effect } from '../../sdk';
import type {ObjectTemplate} from '../../contracts/object-template';
import {defaultNotification,validNotificationValue} from '../notification/definitions';
import {defaultLayerStyle,validLayerValue,layerKeys} from '../scene/layer-style';
import type {LayerKey} from '../../contracts/layer';
import {defaultLayerEditor,validLayerEditorValue} from '../scene/layer-editor';
import type {CopiedSettings,HistoryEntry} from '../../contracts/editor-session';
export class Projects implements ProjectService {
  private project: Project;
  private selected: string | null = null;
  private revision = 0;
  private saved = '';
  private undo: Project[] = [];
  private redo: Project[] = [];
  private past:HistoryEntry[]=[];
  private future:HistoryEntry[]=[];
  private serial=0;
  private clipboard:CopiedSettings|null=null;
  constructor(private effects: () => Effect[], private id = () => crypto.randomUUID(), private templates:()=>ObjectTemplate[] = () => []) {
    this.project = { id: this.id(), name: 'Untitled', format: 1, width: 1920, height: 1080, background: 'transparent', objects: [], modules:{} };
    this.markSaved();
  }
  snapshot(): Snapshot { return structuredClone({project:this.project, selected:this.selected, revision:this.revision, dirty:JSON.stringify(this.project)!==this.saved, canUndo:!!this.undo.length, canRedo:!!this.redo.length,clipboard:this.clipboard,history:{past:this.past,future:[...this.future].reverse(),limit:100}}); }
  markSaved() { this.saved = JSON.stringify(this.project); }
  load(project: Project, saved = true) { this.project = structuredClone(project); this.selected = null; this.undo=[]; this.redo=[];this.past=[];this.future=[];this.clipboard=null; this.revision++; if(saved)this.markSaved();else this.saved=''; }
  private stepHistory(direction:'undo'|'redo'){
    const source=direction==='undo'?this.undo:this.redo,target=direction==='undo'?this.redo:this.undo;
    const labels=direction==='undo'?this.past:this.future,other=direction==='undo'?this.future:this.past;
    const previous=source.pop();if(!previous)return false;
    target.push(this.project);this.project=previous;other.push(labels.pop()!);return true;
  }
  private validSelection(){if(!this.project.objects.some(o=>o.id===this.selected))this.selected=null;}
  dispatch(command: Command): Snapshot {
    if((command.type==='patch'||command.type==='move'||command.type==='settings-reset'||command.type==='settings-paste'||command.type==='history-jump')&&command.revision!==this.revision)throw Error('Stale object edit');
    if (command.type === 'select') { if (command.id && !this.project.objects.some(o=>o.id===command.id)) throw Error('Missing object'); this.selected=command.id; this.revision++; return this.snapshot(); }
    if (command.type === 'undo' || command.type === 'redo') {
      if(this.stepHistory(command.type)){this.validSelection();this.revision++;}return this.snapshot();
    }
    if(command.type==='history-jump'){
      const all=[...this.past,...[...this.future].reverse()],index=command.target===null?-1:all.findIndex(e=>e.id===command.target);
      if(command.target!==null&&index<0)throw Error('historyUnavailable');
      const count=index+1;if(count===this.past.length)return this.snapshot();
      while(this.past.length>count)this.stepHistory('undo');while(this.past.length<count)this.stepHistory('redo');
      this.validSelection();this.revision++;return this.snapshot();
    }
    if(command.type==='settings-copy'){
      const object=this.project.objects.find(o=>o.id===command.id);if(!object)throw Error('Missing object');
      const version=this.project.modules[object.type],effect=this.effects().find(e=>e.id===object.type&&e.version===version);
      this.clipboard=structuredClone({projectId:this.project.id,name:object.name,type:object.type,version,values:effect?Object.fromEntries(effect.settings.map(s=>[s.id,object.settings[s.id]??s.default])):null,...(object.layer?{appearance:object.layer}:{})});
      this.revision++;return this.snapshot();
    }
    const next=structuredClone(this.project);
    if(command.type==='clear-solo'){
      for(const object of next.objects)if(object.editor?.solo)object.editor.solo=false;
    }else if(command.type==='notification'){
      if(!validNotificationValue(command.key,command.value))throw Error('Invalid notification setting');
      next.notification={...next.notification??defaultNotification(),[command.key]:command.value};
    }else if(command.type==='add') {
      const effect=this.effects().find(e=>e.id===command.effect); if(!effect) throw Error('Missing effect');
      const template=command.template===undefined?this.templates().find(t=>t.effect===effect.id):this.templates().find(t=>t.id===command.template&&t.effect===effect.id);
      if(command.template!==undefined&&!template)throw Error('Missing object template');
      if(template&&Object.keys(template.values).some(key=>!effect.settings.some(s=>s.id===key)))throw Error('Unknown template setting');
      if(next.modules[effect.id]&&next.modules[effect.id]!==effect.version)throw Error('Module version requires migration');
      next.modules[effect.id]=effect.version;
      const object={id:this.id(),type:effect.id,name:template?.label.en??effect.label.en,visible:true,settings:{...Object.fromEntries(effect.settings.map(s=>[s.id,structuredClone(s.default)])),...structuredClone(template?.values??{})}};
      next.objects.push(object); this.selected=object.id;
    } else {
      const object=next.objects.find(o=>o.id===command.id); if(!object) throw Error('Missing object');
      if(object.editor?.locked&&!['editor','visibility','duplicate'].includes(command.type))throw Error('layerLocked');
      let pasted:Record<string,Value>|null=null;
      if(command.type==='settings-paste'){
        const buffer=this.clipboard;if(!buffer||buffer.projectId!==next.id)throw Error('settingsClipboardEmpty');
        if(!Array.isArray(command.keys)||command.keys.length>100||new Set(command.keys).size!==command.keys.length||(!command.keys.length&&!command.appearance))throw Error('settingsPasteInvalid');
        if(command.keys.length){
          if(!buffer.values||object.type!==buffer.type||next.modules[object.type]!==buffer.version||!this.effects().some(e=>e.id===object.type&&e.version===buffer.version))throw Error('settingsPasteIncompatible');
          if(command.keys.some(key=>!Object.hasOwn(buffer.values!,key)))throw Error('settingsPasteInvalid');
          pasted=Object.fromEntries(command.keys.map(key=>[key,buffer.values![key]]));
        }
        if(command.appearance){
          if(buffer.appearance&&layerKeys.some(key=>!validLayerValue(key,buffer.appearance![key])))throw Error('settingsPasteInvalid');
          const defaults=defaultLayerStyle();
          if(layerKeys.some(key=>(object.layer??defaults)[key]!==(buffer.appearance??defaults)[key])){
            if(buffer.appearance)object.layer=structuredClone(buffer.appearance);else delete object.layer;
          }
        }
      }
      if(command.type==='settings-reset'){
        if(command.scope==='effect'){
          const effect=this.effects().find(e=>e.id===object.type&&e.version===next.modules[object.type]);if(!effect)throw Error('Missing effect');
          const definitions=command.key===null?effect.settings:effect.settings.filter(s=>s.id===command.key);if(command.key!==null&&!definitions.length)throw Error('Unknown setting');
          for(const definition of definitions)if((object.settings[definition.id]??definition.default)!==definition.default)object.settings[definition.id]=structuredClone(definition.default);
        }else if(command.scope==='layer'){
          const defaults=defaultLayerStyle();
          if(command.key===null){if(layerKeys.some(key=>(object.layer??defaults)[key]!==defaults[key]))delete object.layer;}
          else{if(!layerKeys.includes(command.key as LayerKey))throw Error('Unknown layer setting');const key=command.key as LayerKey;if((object.layer??defaults)[key]!==defaults[key])object.layer={...object.layer??defaults,[key]:defaults[key]};}
        }else throw Error('Invalid reset scope');
      }
      if(command.type==='editor'){
        if(!validLayerEditorValue(command.key,command.value))throw Error('Invalid layer editor setting');
        const editor=object.editor??defaultLayerEditor();if(editor[command.key]!==command.value)object.editor={...editor,[command.key]:command.value};
      }
      if(command.type==='layer'){
        if(!validLayerValue(command.key,command.value))throw Error('Invalid layer setting');
        const layer=object.layer??defaultLayerStyle();
        if(layer[command.key]!==command.value)object.layer={...layer,[command.key]:command.value};
      }
      if(command.type==='set'||command.type==='patch'||pasted) for(const [key,value] of Object.entries(command.type==='set'?{[command.key]:command.value}:command.type==='patch'?command.values:pasted!)) {
        const definition=this.effects().find(e=>e.id===object.type&&e.version===next.modules[object.type])?.settings.find(s=>s.id===key);
        if(!definition) throw Error('Unknown setting');
        if(definition.type==='source'){
          if(typeof value!=='string'||(value!==''&&!next.objects.some(o=>o.id===value&&o.id!==object.id&&o.type===definition.sourceType)))throw Error(command.type==='settings-paste'?'settingsPasteLinksInvalid':'Invalid source');
          const visiting=new Set<string>();
          const follows=(id:string):boolean=>{if(id===object.id)return true;if(visiting.has(id))return false;visiting.add(id);const source=next.objects.find(o=>o.id===id);if(!source)return false;
            return (this.effects().find(e=>e.id===source.type)?.settings??[]).filter(s=>s.type==='source').some(s=>typeof source.settings[s.id]==='string'&&follows(String(source.settings[s.id])));};
          if(value&&follows(value))throw Error(command.type==='settings-paste'?'settingsPasteLinksInvalid':'Cyclic source');
        }
        if(definition.type==='number' && (typeof value!=='number' || !Number.isFinite(value) || value<(definition.min??-Infinity) || value>(definition.max??Infinity))) throw Error('Invalid numeric value');
        if(definition.type==='number' && definition.step && Math.abs((Number(value)-(definition.min??0))/definition.step-Math.round((Number(value)-(definition.min??0))/definition.step))>1e-6) throw Error('Invalid numeric step');
        if(definition.type==='select'&&!definition.options?.some(option=>option.value===value))throw Error('Invalid selection');
        if((definition.type==='string'||definition.type==='color') && (typeof value!=='string' || value.length>4000 || (definition.type==='color'&&!/^#[a-f0-9]{6}$/i.test(value)))) throw Error('Invalid text/color');
        object.settings[key]=value;
      }
      if(command.type==='remove') next.objects=next.objects.filter(o=>o.id!==object.id);
      if(command.type==='rename') {if(typeof command.name!=='string'||!command.name.trim()||command.name.length>200)throw Error('Invalid layer name');object.name=command.name.trim();}
      if(command.type==='move') {
        if(command.placement!=='above'&&command.placement!=='below')throw Error('Invalid layer placement');
        if(!next.objects.some(o=>o.id===command.targetId))throw Error('Missing target layer');
        if(command.targetId!==object.id){next.objects=next.objects.filter(o=>o.id!==object.id);const target=next.objects.findIndex(o=>o.id===command.targetId);next.objects.splice(target+(command.placement==='above'?1:0),0,object);}
      }
      if(command.type==='visibility') object.visible=!object.visible;
      if(command.type==='reorder'){const index=next.objects.findIndex(o=>o.id===object.id),target=index+(command.direction==='up'?1:-1);if(target>=0&&target<next.objects.length)[next.objects[index],next.objects[target]]=[next.objects[target],next.objects[index]];}
      if(command.type==='duplicate') { const copy=structuredClone(object); copy.id=this.id();if(copy.editor){copy.editor.locked=false;copy.editor.solo=false;} next.objects.push(copy); this.selected=copy.id; }
    }
    if(JSON.stringify(next)===JSON.stringify(this.project)) return this.snapshot();
    const subject='id' in command?next.objects.find(o=>o.id===command.id)??this.project.objects.find(o=>o.id===command.id):command.type==='add'?next.objects.find(o=>o.id===this.selected):undefined;
    this.past.push({id:++this.serial,action:command.type,time:Date.now(),...(subject?{name:subject.name,objectType:subject.type}:{}),...('key' in command&&command.key?{key:command.key}:{}),...('scope' in command?{scope:command.scope}:{})});
    this.undo.push(this.project); if(this.undo.length>100){this.undo.shift();this.past.shift();} this.redo=[];this.future=[]; this.project=next;if(command.type==='patch')this.selected=command.id;this.validSelection(); this.revision++; return this.snapshot();
  }
}
