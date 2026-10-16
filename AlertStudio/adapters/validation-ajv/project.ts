import Ajv from 'ajv';
import type { Project, Command } from '../../contracts/project';
const value={type:['number','string','boolean']};
const id={type:'string',pattern:'^[a-zA-Z0-9-]{1,80}$'};
const validate=new Ajv({allowUnionTypes:true}).compile({type:'object',additionalProperties:false,required:['id','name','format','width','height','background','objects','modules'],properties:{
  id,name:{type:'string',maxLength:200},format:{const:1},width:{type:'integer',minimum:320,maximum:3840},height:{type:'integer',minimum:180,maximum:2160},background:{type:'string',pattern:'^(transparent|#[a-fA-F0-9]{6})$'},
  modules:{type:'object',propertyNames:{pattern:'^[a-z][a-z0-9-]{0,63}$'},additionalProperties:{type:'string',pattern:'^[0-9]+\\.[0-9]+\\.[0-9]+$'}},
  objects:{type:'array',maxItems:1000,items:{type:'object',additionalProperties:false,required:['id','type','name','visible','settings'],properties:{id,type:id,name:{type:'string',maxLength:200},visible:{type:'boolean'},settings:{type:'object',propertyNames:{pattern:'^[a-zA-Z][a-zA-Z0-9-]{0,63}$'},additionalProperties:value}}}}
}});
export function validateProject(raw:unknown):Project { if(!validate(raw)) throw Error('Invalid project: '+JSON.stringify(validate.errors)); const p=raw as Project; if(new Set(p.objects.map(o=>o.id)).size!==p.objects.length) throw Error('Duplicate object ID'); if(p.objects.some(o=>!p.modules[o.type]))throw Error('Missing module lock reference');return p; }
const variants=[
  {type:{const:'add'},effect:id}, {type:{const:'select'},id:{anyOf:[id,{type:'null'}]}},
  {type:{enum:['remove','duplicate','visibility']},id}, {type:{const:'set'},id,key:{type:'string'},value},
  {type:{const:'patch'},id,values:{type:'object',minProperties:1,maxProperties:100,propertyNames:{pattern:'^[a-zA-Z][a-zA-Z0-9-]{0,63}$'},additionalProperties:value},revision:{type:'integer',minimum:0}},
  {type:{enum:['undo','redo']}}
].map(properties=>({type:'object',additionalProperties:false,required:Object.keys(properties),properties}));
const check=new Ajv({allowUnionTypes:true}).compile({oneOf:variants});
export function validateCommand(raw:unknown):Command { if(!check(raw)) throw Error('Invalid command'); return raw as Command; }
