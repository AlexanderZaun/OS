import type {UiHost} from '../../../../sdk/ui';
import {networkEffect} from './model';
import {networkRenderer} from './canvas2d';
export function register(host:UiHost){host.registerEffect(networkEffect);host.registerCanvasRenderer(networkRenderer);}
