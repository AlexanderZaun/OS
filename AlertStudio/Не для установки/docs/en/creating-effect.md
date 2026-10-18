# Creating an effect

[Русский](<../creating-effect.md>) · [English](<creating-effect.md>) · [Contents](<README.md>)

1. Use examples/orbit and its separately built manifest as the working example.
2. Keep setting definitions separate from evaluate and project values. Every label needs ru/en.
3. Neutral evaluate(values,time,context?) returns primitives. Seed and explicit time must reproduce results; frame evaluation must not dispatch project commands.
4. When needed, register a specialized Canvas renderer through sdk/canvas2d.ts with correct disposal. Define editor geometry through Effect.editor.
5. Build the package, compute its inventory, install through Edit → Extensions and restart. Check two independent instances, sources, seeking, undo, save/open, PNG and a detached window.

Do not import Electron/React/Canvas into core or sdk/index.ts. Missing renderers and unavailable sources need diagnostics. The SDK is experimental; see the [complete contract](module-sdk.md).
