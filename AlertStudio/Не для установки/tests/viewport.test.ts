import {test} from 'node:test';
import assert from 'node:assert/strict';
import {zoomAt,frameCamera,parseZoomPercent,clampScale} from '../core/geometry/viewport';
test('Camera zoom preserves a scene point at its screen anchor including clamped limits',()=>{
  const previous={scale:.45,x:73,y:-29},point={x:201,y:-133};
  for(const scale of [.001,.01,.5,1,8,50]){const camera=zoomAt(previous,scale,point);assert.equal(camera.scale,clampScale(scale));
    assert.ok(Math.abs((point.x-camera.x)/camera.scale-(point.x-previous.x)/previous.scale)<1e-9);assert.ok(Math.abs((point.y-camera.y)/camera.scale-(point.y-previous.y)/previous.scale)<1e-9);
  }
  assert.deepEqual(zoomAt(previous,previous.scale,point),previous);
});
test('Framing contains every rotated corner with padding and centers the object away from scene origin',()=>{
  for(const rotation of [0,.3,Math.PI/2,-1.7]){const box={x:320,y:780,width:460,height:140,rotation},stage={width:640,height:400},scene={width:1920,height:1080},camera=frameCamera(box,stage,scene)!;
    assert.ok(Math.abs((box.x-scene.width/2)*camera.scale+camera.x)<1e-9);assert.ok(Math.abs((box.y-scene.height/2)*camera.scale+camera.y)<1e-9);
    for(const x of [-box.width/2,box.width/2])for(const y of [-box.height/2,box.height/2]){assert.ok(Math.abs((x*Math.cos(rotation)-y*Math.sin(rotation))*camera.scale)<=stage.width/2-24+1e-9);assert.ok(Math.abs((x*Math.sin(rotation)+y*Math.cos(rotation))*camera.scale)<=stage.height/2-24+1e-9);}
  }
  assert.equal(frameCamera({x:0,y:0,width:1,height:1},{width:1000,height:1000},{width:1920,height:1080})!.scale,8);
  assert.equal(frameCamera({x:0,y:0,width:0,height:1},{width:500,height:500},{width:1920,height:1080}),null);
  assert.equal(frameCamera({x:0,y:0,width:100,height:100},{width:40,height:500},{width:1920,height:1080}),null);
});
test('Percent input accepts decimal comma and percent suffix, clamps limits and rejects malformed values',()=>{
  for(const [text,expected] of [['123.5',1.235],[' 62,5 % ',.625],['.5',.01],['900',8],['1',.01],['800%',8]] as const)assert.equal(parseZoomPercent(text),expected);
  for(const text of ['', '0','-10','Infinity','NaN','1e2','10abc','12%%','1,2,3'])assert.equal(parseZoomPercent(text),null);
  assert.equal(clampScale(NaN),1);assert.equal(clampScale(Infinity),1);
});
