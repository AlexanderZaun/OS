# Experimental SDK 0.1

[Русский](<../module-sdk.md>) · [English](<module-sdk.md>) · [Contents](<README.md>)

## Package and activation

A package is a folder containing manifest.json and ESM entry.js. The manifest includes id, version, kind (panel/effect), sdk (0.1), entry, exact dependencies, backends and files inventory: {relativePath: sha256}. Entry and every resource must be inventoried. Escaping paths, symlinks, invalid paths and size above 20 MB are rejected. Hashes do not establish author trust.

export function register(host) registers a panel or effect. The host supplies React; packages must not bundle their own React or use unresolved bare imports. tools/module-builder/build.mjs builds project-info and orbit separately from the application.

Installation: validate → copy inventory into staging → validate again → rename into installed/id/version → ready marker. Packages without ready remain inert. Activation after restart rechecks inventory and dependency order. Reinstalling an ID and updates are currently rejected; --safe disables external packages. Startup validation failure disables the external set; synchronous register failure rolls back registration. Full asynchronous rollback and version management are not implemented.

## Contracts

- sdk/index.ts defines neutral Effect, Setting, Primitive and RenderLayer. evaluate(values,time,context?) may request context.source(settingId). Existing two-argument evaluate functions remain supported.
- sdk/ui.ts defines React-specific PanelProps. interactionPending blocks edits during structural operations. workspace optionally exposes panels/open/detach without raw Dockview/IPC; it may be absent in detached windows.
- sdk/canvas2d.ts defines registerCanvasRenderer({kind,create}) and instances with draw(context,primitive)/dispose. The backend creates a renderer for ownerId/kind and disposes it when the object disappears. Unknown kinds are skipped.
- Effect.editor defines position and bounds(values,measureText,context?). Position may depend on values. Geometry does not require DOM in the neutral SDK; patch validates revision and creates one history step.

External code executes in the renderer. Only validated declarative definitions cross into main, without evaluate/editor functions. Resources use studio://extensions/&lt;id&gt;/&lt;version&gt;/&lt;inventory-path&gt; for activated files only, with explicit MIME/CORS. CSP blocks network sources. Extensions are trusted: this does not isolate hostile code, which can block the UI.

## Additions within SDK 0.1

when.and supports additional conditions. StarPoint.baseX/baseY supplies stable-network rest coordinates; persistent IDs are required for a reproducible graph. densityAlpha separates cloud fading from twinkling. StarField.cloud passes a fog mask to the network. Primitive.warning becomes a diagnostic.

RenderLayer separates appearance from effects; render(primitives,opacity?,layers?) preserves calls without layers. Specialized renderers participate in shared layers and PNG. Snapshot.clipboard/history are session data outside Project; settings-copy/settings-paste/history-jump are validated in main/core.

## Status

The project-info panel and orbit effect are tested after build/restart and portable relocation. Current-frame PNG uses the shared renderer; there is no separate universal export host for future formats. Image/simulation modifiers, a lifecycle registry, package update/rollback and several independent third-party modules are needed before a stable SDK declaration. See [creating an effect](creating-effect.md), [a panel](creating-panel.md) and [a modifier](creating-modifier.md).
