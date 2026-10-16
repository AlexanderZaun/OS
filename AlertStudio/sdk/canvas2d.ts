import type { Primitive } from './index';

// Backend-specific contract. Never import this into the model or simulation.
export interface CanvasRendererInstance {
  draw(context: CanvasRenderingContext2D, primitive: Primitive): void;
  dispose(): void;
}
export interface CanvasRendererFactory {
  kind: string;
  create(): CanvasRendererInstance;
}
export interface Canvas2DHost {
  registerCanvasRenderer(factory: CanvasRendererFactory): void;
}
