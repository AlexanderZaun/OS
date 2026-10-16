import Ajv from 'ajv';
import type { Manifest } from '../../sdk';
const segment='^[a-z][a-z0-9-]{0,63}$';
const schema={type:'object',additionalProperties:false,required:['id','version','kind','sdk','entry','dependencies','backends','files'],properties:{
  id:{type:'string',pattern:segment},version:{type:'string',pattern:'^[0-9]+\\.[0-9]+\\.[0-9]+$'},kind:{enum:['panel','effect']},sdk:{const:'0.1'},
  entry:{type:'string',pattern:'^[a-zA-Z0-9_/-]+\\.js$'},dependencies:{type:'object',propertyNames:{pattern:segment},additionalProperties:{type:'string',pattern:'^[0-9]+\\.[0-9]+\\.[0-9]+$'}},
  backends:{type:'array',uniqueItems:true,items:{enum:['canvas2d']}},files:{type:'object',minProperties:1,maxProperties:100,additionalProperties:{type:'string',pattern:'^[a-f0-9]{64}$'}}
}};
const ajv=new Ajv({allErrors:true}); const validate=ajv.compile(schema);
export function validateManifest(raw:unknown): Manifest { if(!validate(raw)) throw Error(ajv.errorsText(validate.errors)); return raw as unknown as Manifest; }
export function safeRelative(path:string) {
  if(!/^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*(?:\.(?:js|json|png|webp|svg))$/.test(path) || path.includes('..')) throw Error(`Unsafe path: ${path}`);
  return path;
}
