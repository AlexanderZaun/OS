import type { UiHost } from '../../../../sdk/ui';
import { fogEffect } from './model';
import { fogRenderer } from './canvas2d';
export function register(host:UiHost){host.registerEffect(fogEffect);host.registerCanvasRenderer(fogRenderer);}
