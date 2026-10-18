# Technology boundaries

[Русский](<../technology-boundaries.md>) · [English](<technology-boundaries.md>) · [Contents](<README.md>)

| Technology | Allowed area |
|---|---|
| React | Views, bootstrap, UI SDK and Dockview adapter |
| Electron | Desktop adapter and preload |
| Dockview | Workspace adapter; panel components do not import Dockview |
| Canvas API | Render adapter and explicitly Canvas-specific SDK |
| Ajv | Validation adapter |

Effect definitions and the saved model must remain independent of these libraries. Replacing the UI requires rewriting React panels; replacing the desktop host requires new file, window and IPC adapters. Shaders are not promised to transfer without adaptation.

tools/check-boundaries.mjs parses imports/exports with the TypeScript compiler API in core/contracts/sdk. The UI-contract exception is explicit; this is not complete transitive analysis or coverage of every dynamic import. A standalone FFmpeg exporter and Pixi are not connected. Electron's ffmpeg.dll does not constitute video export support.
