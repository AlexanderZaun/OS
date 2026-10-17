import Ajv from 'ajv';
import type { Effect } from '../../sdk';
const label = {type:'object',additionalProperties:false,required:['ru','en'],properties:{ru:{type:'string',minLength:1,maxLength:200},en:{type:'string',minLength:1,maxLength:200}}};
const condition={type:'object',additionalProperties:false,required:['key','equals'],properties:{key:{type:'string',pattern:'^[a-zA-Z][a-zA-Z0-9-]{0,63}$'},equals:{type:['number','string','boolean']}}};
const validate = new Ajv({allowUnionTypes:true}).compile({
  type:'object',additionalProperties:false,required:['id','version','label','settings'],properties:{
    id:{type:'string',pattern:'^[a-z][a-z0-9-]{0,63}$'},version:{type:'string',pattern:'^[0-9]+\\.[0-9]+\\.[0-9]+$'},label,
    settings:{type:'array',maxItems:100,items:{type:'object',additionalProperties:false,
      required:['id','type','default','unit','animatable','label'],properties:{
        id:{type:'string',pattern:'^[a-zA-Z][a-zA-Z0-9-]{0,63}$'},type:{enum:['number','string','color','select','source']},sourceType:{type:'string',pattern:'^[a-z][a-z0-9-]{0,63}$'},
        default:{type:['number','string','boolean']},min:{type:'number'},max:{type:'number'},step:{type:'number',exclusiveMinimum:0},
        unit:{type:'string',maxLength:20},animatable:{type:'boolean'},label,
        when:{...condition,properties:{...condition.properties,and:{type:'array',minItems:1,maxItems:8,items:condition}}},
        group:{type:'object',additionalProperties:false,required:['id','label'],properties:{id:{type:'string',pattern:'^[a-z][a-z0-9-]{0,63}$'},label}},
        options:{type:'array',minItems:1,maxItems:100,items:{type:'object',additionalProperties:false,required:['value','label'],properties:{value:{type:['string','number']},label}}},
      },
    }},
  },
});
export function validateEffectDefinition(raw: unknown): Omit<Effect,'evaluate'> {
  if (!validate(raw)) throw Error('Invalid effect definition');
  const definition = raw as unknown as Omit<Effect,'evaluate'>;
  if (new Set(definition.settings.map(setting=>setting.id)).size!==definition.settings.length) throw Error('Duplicate setting ID');
  for (const setting of definition.settings) {
    if(setting.when&&[setting.when,...setting.when.and??[]].some(c=>!definition.settings.some(s=>s.id===c.key)))throw Error('Unknown conditional setting');
    if(setting.type==='source'&&(!setting.sourceType||typeof setting.default!=='string'||setting.default!==''))throw Error('Invalid source definition');
    if (setting.type==='number' && (typeof setting.default!=='number' || !Number.isFinite(setting.default) || setting.default<(setting.min??-Infinity) || setting.default>(setting.max??Infinity))) throw Error('Invalid numeric default');
    if (setting.type==='number' && setting.step && Math.abs((Number(setting.default)-(setting.min??0))/setting.step-Math.round((Number(setting.default)-(setting.min??0))/setting.step))>1e-6) throw Error('Invalid default step');
    if (setting.type==='select' && (!setting.options?.some(option=>option.value===setting.default) || new Set(setting.options.map(option=>option.value)).size!==setting.options.length)) throw Error('Invalid select options/default');
    if ((setting.type==='string'||setting.type==='color') && (typeof setting.default!=='string' || (setting.type==='color'&&!/^#[a-f0-9]{6}$/i.test(setting.default)))) throw Error('Invalid string/color default');
  }
  return definition;
}
