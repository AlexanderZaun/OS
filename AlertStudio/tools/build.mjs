import { build } from 'esbuild';
import { build as vite } from 'vite';
import { mkdir, copyFile } from 'node:fs/promises';
await mkdir('dist/desktop',{recursive:true});
await build({entryPoints:['adapters/desktop-electron/main.ts'],outfile:'dist/desktop/main.cjs',bundle:true,platform:'node',format:'cjs',external:['electron'],sourcemap:true});
await build({entryPoints:['adapters/desktop-electron/preload.ts'],outfile:'dist/desktop/preload.cjs',bundle:true,platform:'node',format:'cjs',external:['electron']});
await vite({root:'.',base:'./',build:{outDir:'dist/ui',emptyOutDir:true}});
await import('./module-builder/build.mjs');
