import {build} from 'esbuild';
import {spawnSync} from 'node:child_process';
await build({entryPoints:['tests/performance.ts'],outfile:'artifacts/performance.cjs',bundle:true,platform:'node',format:'cjs'});
process.exitCode=spawnSync(process.execPath,['artifacts/performance.cjs'],{stdio:'inherit'}).status??1;
