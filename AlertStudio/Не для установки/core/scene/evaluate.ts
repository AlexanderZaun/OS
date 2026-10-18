import type {Project} from '../../contracts/project';
import type {Effect,Primitive} from '../../sdk';
import {displayedObjects} from './layer-editor';
export interface SceneDiagnostic {objectId:string;code:'missing-source'|'wrong-source'|'cycle'|'missing-effect'|'evaluation-error'|'inactive-source'|'limit'|'missing-mask';}
export function createSceneEvaluation(project:Project,effects:Effect[],time:number){
  const objects=new Map(project.objects.map(o=>[o.id,o])),cache=new Map<string,Primitive[]>(),visiting=new Set<string>();
  const diagnostics:SceneDiagnostic[]=[],evaluatedIds:string[]=[];
  const diagnostic=(objectId:string,code:SceneDiagnostic['code'])=>{if(!diagnostics.some(d=>d.objectId===objectId&&d.code===code))diagnostics.push({objectId,code});};
  function evaluate(id:string):Primitive[]{
    if(cache.has(id))return cache.get(id)!;
    if(visiting.has(id)){diagnostic(id,'cycle');return [];}
    const object=objects.get(id)!;
    const effect=effects.find(e=>e.id===object.type&&e.version===project.modules[object.type]);
    if(!effect){diagnostic(id,'missing-effect');cache.set(id,[]);return [];}
    visiting.add(id);evaluatedIds.push(id);let failed=false,result:Primitive[]=[];
    try{
      result=effect.evaluate(object.settings,time,{source<T>(key:string){
        const definition=effect.settings.find(s=>s.id===key&&s.type==='source'),sourceId=String(object.settings[key]??definition?.default??'');
        if(!sourceId){diagnostic(id,'missing-source');failed=true;return undefined;}
        const target=objects.get(sourceId);
        if(!target){diagnostic(id,'missing-source');failed=true;return undefined;}
        if(!definition||target.type!==definition.sourceType){diagnostic(id,'wrong-source');failed=true;return undefined;}
        if(visiting.has(sourceId)){diagnostic(id,'cycle');failed=true;return undefined;}
        const frame=evaluate(sourceId)[0];if(!frame){diagnostic(id,'inactive-source');failed=true;}return frame as Primitive<T>|undefined;
      }});
      if(!Array.isArray(result))throw Error('Invalid effect frame');
    }catch{diagnostic(id,'evaluation-error');failed=true;}
    if(result.some(p=>p.warning==='limit'))diagnostic(id,'limit');
    if(result.some(p=>p.warning==='missing-mask'))diagnostic(id,'missing-mask');
    visiting.delete(id);cache.set(id,failed?[]:result);return cache.get(id)!;
  }
  return {evaluate,diagnostics,evaluatedIds,contextFor:(id:string)=>({source<T>(key:string){
    const object=objects.get(id);if(!object)return undefined;
    const effect=effects.find(e=>e.id===object.type&&e.version===project.modules[object.type]),definition=effect?.settings.find(s=>s.id===key&&s.type==='source');
    const target=objects.get(String(object.settings[key]??''));
    if(!target||target.type!==definition?.sourceType||target.id===id)return undefined;
    return evaluate(target.id)[0] as Primitive<T>|undefined;
  }})};
}
export function evaluateScene(project:Project,effects:Effect[],time:number){const scene=createSceneEvaluation(project,effects,time);const visible=displayedObjects(project);return {primitives:visible.flatMap(o=>scene.evaluate(o.id).map(p=>({...p,ownerId:o.id}))),layers:visible.map(o=>({id:o.id,style:o.layer})),diagnostics:scene.diagnostics,evaluatedIds:scene.evaluatedIds};}
