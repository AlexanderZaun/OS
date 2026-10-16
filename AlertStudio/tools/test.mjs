import {build} from 'esbuild';
import {spawnSync} from 'node:child_process';
await build({entryPoints:['tests/behavior.test.ts'],outfile:'artifacts/behavior.test.cjs',bundle:true,platform:'node',format:'cjs'});
const result=spawnSync(process.execPath,['--test','artifacts/behavior.test.cjs'],{stdio:'inherit'});process.exitCode=result.status??1;
