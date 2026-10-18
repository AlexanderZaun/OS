# Selection and movement

[Русский](<../canvas-editing.md>) · [English](<canvas-editing.md>) · [Contents](<README.md>)

A left click selects the top eligible object; an empty click clears selection. text/fog/stars editor bounds are supported, including rotated regions. Field hit testing includes transparent geometric areas. The selection box is a DOM overlay and is excluded from PNG.

Dragging changes a local preview; release sends one atomic coordinate patch with the original revision. Core validates ranges/steps and creates one undo step. Properties shows committed values during the gesture.

Escape, lost capture/focus, resize/camera changes, project operations and a new authoritative revision cancel the gesture. An old drag cannot overwrite another window's edit. Zoom/pan cannot start during object drag. Hand/Space/middle button pan the camera outside that gesture. Locked layers cannot move.

Effects without Effect.editor remain editable through Layers/Properties but cannot be hit-tested on Canvas. Touch currently pans the camera. Resize/rotation handles, snapping, multiple selection and selection through overlapping fields are not implemented. See [SDK](module-sdk.md) and [locking](layer-editor.md).
