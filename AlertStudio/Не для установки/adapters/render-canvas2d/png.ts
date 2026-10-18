import type {CapturedFrame} from '../../contracts/frame';
import type {Effect} from '../../sdk';
import type {CanvasRendererFactory} from '../../sdk/canvas2d';
import {evaluateScene} from '../../core/scene/evaluate';
import {notificationFrame} from '../../core/notification/evaluate';
import {CanvasBackend} from './index';
// Scene pixels only: CSS preview background, camera and editor overlays are excluded.
export async function renderPng(capture:CapturedFrame,effects:Effect[],factories:CanvasRendererFactory[]):Promise<Uint8Array>{
  const canvas=document.createElement('canvas');canvas.width=capture.project.width;canvas.height=capture.project.height;
  const backend=new CanvasBackend(canvas,factories);
  try{
    const frame=notificationFrame(capture.project.notification,capture.workspace,capture.time);
    const scene=evaluateScene(capture.project,effects,frame.effectTime);backend.render(scene.primitives,frame.opacity,scene.layers);
    const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('PNG encoding failed')),'image/png'));
    return new Uint8Array(await blob.arrayBuffer());
  }finally{backend.dispose();canvas.width=canvas.height=0;}
}
