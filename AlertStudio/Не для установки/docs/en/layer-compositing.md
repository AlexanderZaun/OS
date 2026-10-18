# Layer appearance and PNG

[Русский](<../layer-compositing.md>) · [English](<layer-compositing.md>) · [Contents](<README.md>)

Appearance is separate from effect settings: normal/screen/multiply and other modes from contracts/layer.ts (13), clip, hue −180…180°, saturation 0…200% and opacity 0…100%. Defaults are normal, clip off, hue 0 and saturation/opacity 100. Numeric values are integers; invalid input does not change the model.

Clip uses the alpha of the nearest previous visible layer in drawing order, not necessarily the effect source. Solo changes the drawn layer list. Sources still supply raw primitives; compositing does not change their geometry or data. Empty visible layers remain explicit and matter for clipping.

CanvasBackend applies appearance through temporary surfaces, then applies stage group opacity once to the whole composition. Old render calls without RenderLayer remain supported. Style changes are undoable edits; values persist in separate files.

File → Export frame as PNG… captures project/time/workspace and renders separately at scene resolution. Transparency, appearance, clipping and stage fade are preserved; checkerboard, selection and UI are excluded. Cancelling writes nothing; errors never report success. Main validates PNG and dimensions before writing. This exports the current frame, not a sequence or WebM.

Checks compare pixels/alpha, dimensions, cancel/failure, fade and unchanged project/history. See [format](project-format.md) and [stages](notification-workspaces.md).
