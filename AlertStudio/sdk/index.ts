import type { Value } from '../contracts/project';
export const SDK_VERSION = '0.1.0';
export interface Manifest { id: string; version: string; kind: 'panel' | 'effect'; sdk: '0.1'; entry: string; dependencies: Record<string, string>; backends: string[]; files: Record<string, string>; }
export interface Setting { id: string; type: 'number' | 'string' | 'color'; default: Value; min?: number; max?: number; unit: string; animatable: boolean; label: { ru: string; en: string }; }
export interface Primitive { kind: 'rect' | 'text'; x: number; y: number; width: number; height: number; color: string; opacity: number; text?: string; size?: number; }
export interface Effect { id: string; version: string; label: { ru: string; en: string }; settings: Setting[]; evaluate(values: Record<string, Value>, time: number): Primitive[]; }
export interface ModuleHost { registerEffect(effect: Effect): void; }
export interface RenderBackend { render(primitives: Primitive[]): void; dispose(): void; }
