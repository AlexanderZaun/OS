import {layerTags,type LayerEditor,type LayerEditorKey} from '../../contracts/layer-editor';
import type {Project,Value} from '../../contracts/project';
export const layerEditorKeys:LayerEditorKey[]=['locked','solo','tag'];
export function defaultLayerEditor():LayerEditor{return {version:1,locked:false,solo:false,tag:'none'};}
export function validLayerEditorValue(key:LayerEditorKey,value:Value){return key==='tag'?layerTags.includes(value as LayerEditor['tag']):(key==='locked'||key==='solo')&&typeof value==='boolean';}
export function displayedObjects(project:Project){const solo=project.objects.some(o=>o.editor?.solo);return project.objects.filter(o=>o.visible&&(!solo||o.editor?.solo));}
