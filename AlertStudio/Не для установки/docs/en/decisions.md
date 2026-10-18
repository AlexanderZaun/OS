# Technical decisions

[Русский](<../decisions.md>) · [English](<decisions.md>) · [Contents](<README.md>)

These versions come from local package.json, not a list of latest releases: Electron 44.8.0, React/ReactDOM 19.3.1, Dockview React 8.5.1, Ajv 8.17.1, TypeScript 5.9.3, Vite 8.3.4, esbuild 0.28.2 and Playwright 1.64.1. pnpm-lock.yaml pins the tree. Checks used Node 24.19.0 and pnpm 11.25.0; the build requires Node 22.12+.

- TypeScript checks interfaces; Ajv validates external JSON and runtime commands.
- React handles panels rather than frame simulation. Electron provides files and windows at the cost of a large distribution.
- Dockview handles layout. Vite builds the UI; esbuild separately bundles main/preload and runtime packages.
- Canvas2D already draws text, fog, stars, networks and layer appearance. It is the working backend, not merely a text/rect proof of concept. GPU comparison remains future work.
- Files uses immutable revisions, synced JSON and a validated backup index. Windows FolderLease holds an OS named pipe: a local lock rather than a network server.
- The portable build includes Electron and license texts. node_modules and personal Data are not distributed.

tools/package-portable.mjs assembles THIRD-PARTY-NOTICES.txt from production dependencies and preserves Electron's LICENSE/LICENSES.chromium.html. Hashes establish integrity, not publisher trust. There is no separately signed installer or FFmpeg-based exporter.

Decisions are supported by code and [test evidence](verification.md). Automatically upgrading all dependencies is outside this process.
