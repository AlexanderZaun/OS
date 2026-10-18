# Architecture

[Русский](<../architecture.md>) · [English](<architecture.md>) · [Contents](<README.md>)

## Model and commands

contracts/project.ts defines data, commands and snapshots. core/project/service.ts is the single authoritative model in Electron main; snapshots are cloned. Windows share history, the settings clipboard and selection. History retains 100 steps; history and clipboard are excluded from Project and cleared on load. Atomic patch, move, reset, paste and history-jump validate revision; not every command has optimistic conflict protection.

Core, contracts and sdk/index.ts are independent of React, Electron, Dockview and Canvas. sdk/ui.ts and sdk/canvas2d.ts are explicitly specialized contracts. Bootstrap connects services and adapters.

## Views and rendering

React presents state; Dockview manages panels and layout. The object catalog is a regular movable panel. Menus call bounded Desktop/Command APIs rather than raw IPC. Detached windows share the main model and Playback clock. Each Canvas evaluates its scene locally; particles are not sent over IPC.

core/scene/evaluate.ts resolves fog → stars → network dependencies independently of drawing order. Sources evaluate once per frame. Effects return neutral primitives; CanvasBackend applies layer appearance and stage group opacity. PNG uses a separate Canvas with a captured project and time.

## Storage and boundaries

ProjectSession connects Projects, Files, RecoveryStore and FolderLease. Explicit project operations are serialized; draft writes have a separate queue. Files publishes a pointer to a complete multi-file revision. Failed open preserves the current model and lease.

Packaged builds store Data beside the EXE; development can use ALERT_STUDIO_DATA. Recovery stores relative origins for internal portable projects. Extensions pass staging, inventory checks and activation revalidation. Their code executes in the renderer, not main. Projects contain data only.

Preload exposes named methods. Sender, main frame, commands and JSON are validated; nodeIntegration is off, contextIsolation and sandbox are on. Shared UI tokens live in ui-kit/theme.css; dialogs use ui-kit/Dialog.tsx.

## Limitations

Shared heavy simulation, a GPU backend, a complete media encoder and universal windows through an abstract WindowAdapter are not implemented. SDK 0.1 remains experimental. See [project format](project-format.md), [SDK](module-sdk.md) and [technology boundaries](technology-boundaries.md).
