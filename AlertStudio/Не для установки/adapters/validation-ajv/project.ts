import Ajv from 'ajv';
import type { Project, Command } from '../../contracts/project';
import {blendModes} from '../../contracts/layer';
import {layerTags} from '../../contracts/layer-editor';
const editor={type:'object',additionalProperties:false,required:['version','locked','solo','tag'],properties:{version:{const:1},locked:{type:'boolean'},solo:{type:'boolean'},tag:{enum:layerTags}}};
const layer={type:'object',additionalProperties:false,required:['version','blend','clip','hue','saturation','opacity'],properties:{version:{const:1},blend:{enum:blendModes},clip:{type:'boolean'},hue:{type:'integer',minimum:-180,maximum:180},saturation:{type:'integer',minimum:0,maximum:200},opacity:{type:'integer',minimum:0,maximum:100}}};
const value={type:['number','string','boolean']};
const id={type:'string',pattern:'^[a-zA-Z0-9-]{1,80}$'};
const notification={type:'object',additionalProperties:false,required:['version','introDuration','holdDuration','outroDuration','introFade','outroFade'],properties:{version:{const:1},introDuration:{type:'number',minimum:.1,maximum:60,multipleOf:.1},holdDuration:{type:'number',minimum:.1,maximum:3600,multipleOf:.1},outroDuration:{type:'number',minimum:.1,maximum:60,multipleOf:.1},introFade:{type:'boolean'},outroFade:{type:'boolean'}}};
const validate=new Ajv({allowUnionTypes:true,multipleOfPrecision:8}).compile({type:'object',additionalProperties:false,required:['id','name','format','width','height','background','objects','modules'],properties:{
  id,notification,name:{type:'string',maxLength:200},format:{const:1},width:{type:'integer',minimum:320,maximum:3840},height:{type:'integer',minimum:180,maximum:2160},background:{type:'string',pattern:'^(transparent|#[a-fA-F0-9]{6})$'},
  modules:{type:'object',propertyNames:{pattern:'^[a-z][a-z0-9-]{0,63}$'},additionalProperties:{type:'string',pattern:'^[0-9]+\\.[0-9]+\\.[0-9]+$'}},
  objects:{type:'array',maxItems:1000,items:{type:'object',additionalProperties:false,required:['id','type','name','visible','settings'],properties:{id,layer,editor,type:id,name:{type:'string',maxLength:200},visible:{type:'boolean'},settings:{type:'object',propertyNames:{pattern:'^[a-zA-Z][a-zA-Z0-9-]{0,63}$'},additionalProperties:value}}}}
}});
export function validateProject(raw:unknown):Project { if(!validate(raw)) throw Error('Invalid project: '+JSON.stringify(validate.errors)); const p=raw as Project; if(new Set(p.objects.map(o=>o.id)).size!==p.objects.length) throw Error('Duplicate object ID'); if(p.objects.some(o=>!p.modules[o.type]))throw Error('Missing module lock reference');return p; }
const variants=[
  {type:{const:'settings-copy'},id},
  {type:{const:'settings-paste'},id,keys:{type:'array',maxItems:100,uniqueItems:true,items:{type:'string',pattern:'^[a-zA-Z][a-zA-Z0-9-]{0,63}$'}},appearance:{type:'boolean'},revision:{type:'integer',minimum:0}},
  {type:{const:'history-jump'},target:{anyOf:[{type:'integer',minimum:1},{type:'null'}]},revision:{type:'integer',minimum:0}},
  {type:{const:'settings-reset'},id,scope:{enum:['effect','layer']},key:{anyOf:[{type:'string',pattern:'^[a-zA-Z][a-zA-Z0-9-]{0,63}$'},{type:'null'}]},revision:{type:'integer',minimum:0}},
  {type:{const:'editor'},id,key:{enum:['locked','solo','tag']},value},
  {type:{const:'clear-solo'}},
  {type:{const:'layer'},id,key:{enum:['blend','clip','hue','saturation','opacity']},value},
  {type:{const:'notification'},key:{enum:['introDuration','holdDuration','outroDuration','introFade','outroFade']},value},
  {type:{const:'reorder'},id,direction:{enum:['up','down']}},
  {type:{const:'rename'},id,name:{type:'string',minLength:1,maxLength:200}},
  {type:{const:'move'},id,targetId:id,placement:{enum:['above','below']},revision:{type:'integer',minimum:0}},
  {type:{const:'add'},effect:id,template:id}, {type:{const:'select'},id:{anyOf:[id,{type:'null'}]}},
  {type:{enum:['remove','duplicate','visibility']},id}, {type:{const:'set'},id,key:{type:'string'},value},
  {type:{const:'patch'},id,values:{type:'object',minProperties:1,maxProperties:100,propertyNames:{pattern:'^[a-zA-Z][a-zA-Z0-9-]{0,63}$'},additionalProperties:value},revision:{type:'integer',minimum:0}},
  {type:{enum:['undo','redo']}}
].map(properties=>({type:'object',additionalProperties:false,required:Object.keys(properties).filter(key=>key!=='template'),properties}));
const check=new Ajv({allowUnionTypes:true}).compile({oneOf:variants});
export function validateCommand(raw:unknown):Command { if(!check(raw)) throw Error('Invalid command'); return raw as Command; }
