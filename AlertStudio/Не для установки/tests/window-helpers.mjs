// CDP input still reaches Chromium; native desktop mouse motion must not cancel test pointer capture.
export async function isolateDesktopPointer(app,page){
  const window=await app.browserWindow(page);await window.evaluate(w=>w.setIgnoreMouseEvents(true));
  const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setFocusEmulationEnabled',{enabled:true});
}

export async function resizeWindow(app,page,width,height){
  const handle=await app.browserWindow(page);
  const content=await handle.evaluate(async(window,[width,height])=>{
    const outer=window.getSize(),content=window.getContentSize();
    const expected=[width-(outer[0]-content[0]),height-(outer[1]-content[1])];
    if(outer[0]!==width||outer[1]!==height)await new Promise(resolve=>{window.once('resize',resolve);window.setSize(width,height);});
    return expected;
  },[width,height]);
  await page.waitForFunction(([width,height])=>innerWidth===width&&innerHeight===height,content);
  await waitForCanvasLayout(page);
}
export async function waitForCanvasLayout(page){
  await page.locator('.canvas-stage canvas').first().waitFor({state:'attached'});
  await page.evaluate(async()=>{
    let previous='',stable=0;
    for(let i=0;i<120;i++){
      await new Promise(requestAnimationFrame);
      const canvas=document.querySelector('.canvas-stage canvas');if(!canvas){previous='';stable=0;continue;}const rect=canvas.getBoundingClientRect(),stage=canvas.parentElement.getBoundingClientRect();
      const signature=[rect.x,rect.y,rect.width,rect.height,stage.x,stage.y,stage.width,stage.height].join(',');
      stable=signature===previous?stable+1:0;previous=signature;if(stable>=6)return;
    }
    throw Error('Canvas layout did not settle');
  });
}
export async function waitForCanvasScale(canvas,scale){
  await canvas.page().waitForFunction(({scale})=>{
    const canvas=document.querySelector('.canvas-stage canvas');return Math.abs(canvas.getBoundingClientRect().width/canvas.width-scale)<.00001;
  },{scale});
  await waitForCanvasLayout(canvas.page());
}
export async function waitForCanvasFit(page){
  await page.waitForFunction(()=>{
    const canvas=document.querySelector('.canvas-stage canvas'),stage=canvas.parentElement.getBoundingClientRect();
    const scale=Math.max(.01,Math.min(8,(stage.width-48)/canvas.width,(stage.height-48)/canvas.height));
    return Math.abs(canvas.getBoundingClientRect().width/canvas.width-scale)<.00001;
  });
  await waitForCanvasLayout(page);
}
