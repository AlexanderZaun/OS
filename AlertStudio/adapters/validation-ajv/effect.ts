import Ajv from 'ajv';
import type { Effect } from '../../sdk';
const label={type:'object',additionalProperties:false,required:['ru','en'],properties:{ru:{type:'string',minLength:1,maxLength:200},en:{type:'string',minLength:1,maxLength:200}}};
const validate=new Ajv({allowUnionTypes:true}).compile({type:'object',additionalProperties:false,required:['id','version','label','settings'],properties:{id:{type:'string',pattern:'^[a-z][a-z0-9-]{0,63}$'},version:{type:'string',pattern:'^[0-9]+\\.[0-9]+\\.[0-9]+$'},label,settings:{type:'array',maxItems:100,items:{type:'object',additionalProperties:false,required:['id','type','default','unit','animatable','label'],properties:{id:{type:'string',pattern:'^[a-zA-Z][a-zA-Z0-9-]{0,63}$'},type:{enum:['number','string','color']},default:{type:['number','string','boolean']},min:{type:'number'},max:{type:'number'},unit:{type:'string',maxLength:20},animatable:{type:'boolean'},label}}}}});
export function validateEffectDefinition(raw:unknown):Omit<Effect,'evaluate'> {
  if(!validate(raw))throw Error('Invalid effect definition');const d=raw as unknown as Omit<Effect,'evaluate'>;
  if(new Set(d.settings.map(s=>s.id)).size!==d.settings.length)throw Error('Duplicate setting ID');
  for(const s of d.settings){if(s.type==='number'&&(typeof s.default!=='number'||!Number.isFinite(s.default)||s.default<(s.min??-Infinity)||s.default>(s.max??Infinity)))throw Error('Invalid numeric default');if(s.type!=='number'&&(typeof s.default!=='string'||(s.type==='color'&&!/^#[a-f0-9]{6}$/i.test(s.default))))throw Error('Invalid string/color default');}
  return d;
}
