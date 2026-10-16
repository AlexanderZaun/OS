import type * as React from 'react';
import type { Command, Snapshot } from '../contracts/project';
import type { Effect, Manifest } from './index';
import type { Canvas2DHost, CanvasRendererFactory } from './canvas2d';
export type Language = 'ru' | 'en';
export interface PanelProps { snapshot: Snapshot; dispatch(command: Command): void; language: Language; effects: Effect[]; interactionPending?: boolean; canvasRenderers?: CanvasRendererFactory[]; }
export interface Panel { id: string; label: Record<Language, string>; component: React.ComponentType<PanelProps>; }
export interface UiHost extends Canvas2DHost { React: typeof React; registerPanel(panel: Panel): void; registerEffect(effect: Effect): void; }
export interface RuntimeModule { register(host: UiHost): void | (() => void); }
export interface Installed { manifest: Manifest; url: string; }
