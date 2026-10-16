import {build} from 'esbuild';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
for(const name of ['project-info','orbit']) {
  const folder=`dist/packages/${name}`; await mkdir(folder,{recursive:true});
  await build({entryPoints:[`examples/${name}/register.ts`],outfile:`${folder}/entry.js`,bundle:true,format:'esm',platform:'browser',target:'es2022'});
  const base=JSON.parse(await readFile(`examples/${name}/manifest.json`,'utf8'));
  base.files={'entry.js':createHash('sha256').update(await readFile(`${folder}/entry.js`)).digest('hex')};
  await writeFile(`${folder}/manifest.json`,JSON.stringify(base,null,2));
}
