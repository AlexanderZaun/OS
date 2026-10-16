import {build} from 'esbuild';
import {spawnSync} from 'node:child_process';
await build({entryPoints:['tests/behavior.test.ts','tests/fog.test.ts','tests/stars.test.ts'],outdir:'artifacts',outExtension:{'.js':'.cjs'},bundle:true,platform:'node',format:'cjs'});
await build({entryPoints:['tests/lease-worker.ts'],outfile:'artifacts/lease-worker.cjs',bundle:true,platform:'node',format:'cjs'});
const result=spawnSync(process.execPath,['--test','artifacts/behavior.test.cjs','artifacts/fog.test.cjs','artifacts/stars.test.cjs'],{stdio:'inherit'});process.exitCode=result.status??1;
