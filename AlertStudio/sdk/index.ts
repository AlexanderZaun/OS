import type { Value } from '../contracts/project';
export const SDK_VERSION = '0.1.0';
export interface Manifest { id: string; version: string; kind: 'panel' | 'effect'; sdk: '0.1'; entry: string; dependencies: Record<string, string>; backends: string[]; files: Record<string, string>; }
export interface SettingCondition {key:string;equals:Value;}
export interface Setting { id: string; type: 'number' | 'string' | 'color' | 'select' | 'source'; sourceType?:string; when?:SettingCondition&{and?:SettingCondition[]}; default: Value; min?: number; max?: number; step?: number; options?: {value: string | number; label: {ru:string;en:string}}[]; group?: {id:string;label:{ru:string;en:string}}; unit: string; animatable: boolean; label: { ru: string; en: string }; }
export interface Primitive<T = unknown> { kind: string; x: number; y: number; width: number; height: number; color: string; opacity: number; text?: string; size?: number; ownerId?: string; warning?:'limit'|'missing-mask'; data?: T; }
export interface ObjectBounds {x:number;y:number;width:number;height:number;rotation?:number}
export interface EditorGeometry {position:{x:string;y:string}|((values:Record<string,Value>)=>{x:string;y:string});bounds(values:Record<string,Value>,measureText:(text:string,font:string)=>number,context?:EvaluationContext):ObjectBounds;}
export interface EvaluationContext {source<T>(settingId:string):Primitive<T>|undefined;}
export interface Effect { id: string; version: string; label: { ru: string; en: string }; settings: Setting[]; editor?:EditorGeometry; evaluate(values: Record<string, Value>, time: number,context?:EvaluationContext): Primitive[]; }
export interface ModuleHost { registerEffect(effect: Effect): void; }
export interface RenderBackend { render(primitives: Primitive[]): void; dispose(): void; }
