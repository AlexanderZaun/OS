import type {UiHost} from '../../../../sdk/ui';
import {starsEffect} from './model';
import {starsRenderer} from './canvas2d';
export function register(host:UiHost){host.registerEffect(starsEffect);host.registerCanvasRenderer(starsRenderer);}
