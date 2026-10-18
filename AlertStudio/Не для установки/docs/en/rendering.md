# Rendering and preview

[Русский](<../rendering.md>) · [English](<rendering.md>) · [Contents](<README.md>)

Canvas2D draws text/rect plus registered specialized fog/stars/network/orbit primitives. Coordinates are scene pixels and time is seconds; CSS scales the preview. Objects are back-to-front in the array and reversed in Layers. Checkerboard is CSS only.

evaluateScene caches sources per frame independently of z-order, including hidden sources. Canvas shows missing/wrong/inactive/cycle/failed/limit diagnostics. RenderLayer supplies shared blend/clip/hue/saturation/opacity; stage fade applies once to the combined composition. PNG uses the same renderers and excludes UI.

Main clocks synchronize Canvas views; cameras are local. Pause retains the frame and resume continues; an unchanged paused frame is not redrawn. Each additional Canvas performs its own work. Renderers are disposed when objects disappear and views close.

Text uses Arial/sans-serif and explicit newlines; long lines can be compressed by fillText maxWidth. Automatic word wrap, complete typography and reproducible font distribution remain needed. Analytical effects support seeking; stateful collisions will require fixed steps/checkpoints.

Current-frame PNG is implemented; WebM/other video encoders, a GPU/Pixi backend and a universal export host are absent. See [mask limits](line-mask.md) and [layer behavior](layer-compositing.md).
