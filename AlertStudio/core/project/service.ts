import type { Command, Project, ProjectService, Snapshot } from '../../contracts/project';
import type { Effect } from '../../sdk';
export class Projects implements ProjectService {
  private project: Project;
  private selected: string | null = null;
  private revision = 0;
  private saved = '';
  private undo: Project[] = [];
  private redo: Project[] = [];
  constructor(private effects: () => Effect[], private id = () => crypto.randomUUID()) {
    this.project = { id: this.id(), name: 'Untitled', format: 1, width: 1920, height: 1080, background: 'transparent', objects: [], modules:{} };
    this.markSaved();
  }
  snapshot(): Snapshot { return structuredClone({project:this.project, selected:this.selected, revision:this.revision, dirty:JSON.stringify(this.project)!==this.saved, canUndo:!!this.undo.length, canRedo:!!this.redo.length}); }
  markSaved() { this.saved = JSON.stringify(this.project); }
  load(project: Project) { this.project = structuredClone(project); this.selected = null; this.undo=[]; this.redo=[]; this.revision++; this.markSaved(); }
  dispatch(command: Command): Snapshot {
    if (command.type === 'select') { if (command.id && !this.project.objects.some(o=>o.id===command.id)) throw Error('Missing object'); this.selected=command.id; this.revision++; return this.snapshot(); }
    if (command.type === 'undo' || command.type === 'redo') {
      const source = command.type === 'undo' ? this.undo : this.redo, target = command.type === 'undo' ? this.redo : this.undo;
      const previous=source.pop(); if(previous) {target.push(this.project); this.project=previous; this.revision++;} return this.snapshot();
    }
    const next=structuredClone(this.project);
    if(command.type==='add') {
      const effect=this.effects().find(e=>e.id===command.effect); if(!effect) throw Error('Missing effect');
      if(next.modules[effect.id]&&next.modules[effect.id]!==effect.version)throw Error('Module version requires migration');
      next.modules[effect.id]=effect.version;
      const object={id:this.id(),type:effect.id,name:effect.label.en,visible:true,settings:Object.fromEntries(effect.settings.map(s=>[s.id,structuredClone(s.default)]))};
      next.objects.push(object); this.selected=object.id;
    } else {
      const object=next.objects.find(o=>o.id===command.id); if(!object) throw Error('Missing object');
      if(command.type==='set') {
        const definition=this.effects().find(e=>e.id===object.type&&e.version===next.modules[object.type])?.settings.find(s=>s.id===command.key);
        if(!definition) throw Error('Unknown setting');
        if(definition.type==='number' && (typeof command.value!=='number' || !Number.isFinite(command.value) || command.value<(definition.min??-Infinity) || command.value>(definition.max??Infinity))) throw Error('Invalid numeric value');
        if(definition.type!=='number' && (typeof command.value!=='string' || command.value.length>4000 || (definition.type==='color'&&!/^#[a-f0-9]{6}$/i.test(command.value)))) throw Error('Invalid text/color');
        object.settings[command.key]=command.value;
      }
      if(command.type==='remove') next.objects=next.objects.filter(o=>o.id!==object.id);
      if(command.type==='visibility') object.visible=!object.visible;
      if(command.type==='duplicate') { const copy=structuredClone(object); copy.id=this.id(); next.objects.push(copy); this.selected=copy.id; }
    }
    if(JSON.stringify(next)===JSON.stringify(this.project)) return this.snapshot();
    this.undo.push(this.project); if(this.undo.length>100) this.undo.shift(); this.redo=[]; this.project=next; this.revision++; return this.snapshot();
  }
}
