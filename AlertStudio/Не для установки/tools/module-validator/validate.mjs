import {build} from 'esbuild';
import {spawnSync} from 'node:child_process';
if(!process.argv[2])throw Error('Usage: node tools/module-validator/validate.mjs <package-folder>');
await build({stdin:{contents:"import {validatePackage} from './adapters/storage-files/extensions'; validatePackage(process.argv[2]).then(m=>console.log(m.id+'@'+m.version+' validated')).catch(e=>{console.error(e);process.exitCode=1;});",resolveDir:process.cwd(),loader:'ts'},bundle:true,platform:'node',format:'cjs',outfile:'artifacts/validate.cjs'});
process.exitCode=spawnSync(process.execPath,['artifacts/validate.cjs',process.argv[2]],{stdio:'inherit'}).status??1;
