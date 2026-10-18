import {createRequire} from 'node:module';
import {promises as fs} from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {verifyPortable} from './verify-portable.mjs';
import {releaseRoot} from './distribution-paths.mjs';
const root=path.resolve(import.meta.dirname,'..'),require=createRequire(import.meta.url);
if(process.platform!=='win32'||process.arch!=='x64')throw Error('Build the Windows x64 distribution on Windows x64');
const pkg=JSON.parse(await fs.readFile(path.join(root,'package.json'),'utf8'));
const name=`AlertStudio-${pkg.version}-Windows-x64`,output=path.join(releaseRoot,name);
const zip=path.join(releaseRoot,`${name}.zip`),runtime=await fs.realpath(path.join(path.dirname(require.resolve('electron/package.json')),'dist'));
const runtimeFiles=['chrome_100_percent.pak','chrome_200_percent.pak','d3dcompiler_47.dll','dxcompiler.dll','dxil.dll','electron.exe','ffmpeg.dll','icudtl.dat','LICENSE','LICENSES.chromium.html','resources.pak','snapshot_blob.bin','v8_context_snapshot.bin','version','vk_swiftshader_icd.json','vk_swiftshader.dll','vulkan-1.dll'];
const appFiles=['package.json','dist/desktop/main.cjs','dist/desktop/preload.cjs'];
async function walk(folder,base=folder){const files=[];for(const entry of await fs.readdir(folder,{withFileTypes:true})){const file=path.join(folder,entry.name);if(entry.isSymbolicLink())throw Error(`Symlink rejected: ${file}`);if(entry.isDirectory())files.push(...await walk(file,base));else if(entry.isFile())files.push(path.relative(base,file).split(path.sep).join('/'));else throw Error(`Unsupported file: ${file}`);}return files.sort();}
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
await fs.mkdir(releaseRoot,{recursive:true});
try{
  const old=JSON.parse(await fs.readFile(path.join(output,'distribution-manifest.json'),'utf8'));
  const existing=await walk(output);if(existing.length!==Object.keys(old.files).length+1||existing.some(file=>file!=='distribution-manifest.json'&&!old.files[file]))throw Error('Existing distribution contains extra files or user Data. Move it before rebuilding.');
  for(const [file,digest]of Object.entries(old.files))if(sha(await fs.readFile(path.join(output,file)))!==digest)throw Error(`Existing distribution was modified: ${file}`);
  // Only a verified, pristine product under this exact release root may be replaced.
  if(path.dirname(output)!==releaseRoot||!path.basename(output).startsWith('AlertStudio-'))throw Error('Unsafe output path');
  await fs.rm(output,{recursive:true});
}catch(error){if(error.code!=='ENOENT')throw error;}
await fs.mkdir(output,{recursive:false});
for(const entry of await fs.readdir(runtime))if(!runtimeFiles.includes(entry)&&!['resources','locales'].includes(entry))throw Error(`Review new Electron runtime file before publishing: ${entry}`);
for(const file of runtimeFiles)await fs.copyFile(path.join(runtime,file),path.join(output,file==='electron.exe'?'AlertStudio.exe':file));
await fs.mkdir(path.join(output,'locales'));for(const file of await walk(path.join(runtime,'locales'))){if(!/^[a-zA-Z0-9-]+\.pak$/.test(file))throw Error('Unexpected Electron locale');await fs.copyFile(path.join(runtime,'locales',file),path.join(output,'locales',file));}
const appRoot=path.join(output,'resources','app');await fs.mkdir(path.join(appRoot,'dist','desktop'),{recursive:true});
await fs.writeFile(path.join(appRoot,'package.json'),JSON.stringify({name:pkg.name,productName:'AlertStudio',version:pkg.version,type:'module',main:pkg.main}));
for(const file of appFiles.filter(file=>file!=='package.json'))await fs.copyFile(path.join(root,file),path.join(appRoot,file));
for(const file of await walk(path.join(root,'dist','ui'))){if(file.endsWith('.map'))throw Error('Source maps are not distributable');const target=path.join(appRoot,'dist','ui',file);await fs.mkdir(path.dirname(target),{recursive:true});await fs.copyFile(path.join(root,'dist','ui',file),target);}
// Bundled JavaScript includes its dependencies; ship their license texts, not node_modules.
const seen=new Set(),notices=[];
async function license(name,parent){
  let manifest;try{manifest=parent.resolve(`${name}/package.json`);}catch{let dir=path.dirname(parent.resolve(name));while(true){try{const p=path.join(dir,'package.json');if(JSON.parse(await fs.readFile(p,'utf8')).name===name){manifest=p;break;}}catch{}const next=path.dirname(dir);if(next===dir)throw Error(`Package metadata not found: ${name}`);dir=next;}}
  const data=JSON.parse(await fs.readFile(manifest,'utf8')),id=`${data.name}@${data.version}`;if(seen.has(id))return;seen.add(id);
  const folder=path.dirname(manifest),files=await fs.readdir(folder),legal=files.filter(file=>/^(licen[cs]e|copying|notice)([.-].*)?$/i.test(file));
  if(!legal.length)throw Error(`Missing license text: ${id}`);
  notices.push(`\n========== ${id} (${typeof data.license==='string'?data.license:'see license'}) ==========\n`);
  for(const file of legal)if((await fs.stat(path.join(folder,file))).isFile())notices.push(await fs.readFile(path.join(folder,file),'utf8'));
  const local=createRequire(manifest);for(const dependency of Object.keys(data.dependencies??{}))await license(dependency,local);
}
for(const dependency of Object.keys(pkg.dependencies))await license(dependency,require);
await fs.writeFile(path.join(output,'THIRD-PARTY-NOTICES.txt'),notices.join('\n'));
for(const language of ['ru','en'])await fs.copyFile(path.join(root,'docs',`READ-ME.${language}.txt`),path.join(output,`READ-ME.${language}.txt`));
const files={};for(const file of await walk(output))files[file]=sha(await fs.readFile(path.join(output,file)));
await fs.writeFile(path.join(output,'distribution-manifest.json'),JSON.stringify({product:'AlertStudio',version:pkg.version,platform:'win32',architecture:'x64',electron:(await fs.readFile(path.join(runtime,'version'),'utf8')).trim(),files},null,2));
await verifyPortable(output);
await fs.rm(zip,{force:true});
const result=spawnSync(path.join(process.env.SystemRoot??'C:\\Windows','System32','tar.exe'),['-a','-c','-f',zip,'-C',releaseRoot,name],{stdio:'inherit',windowsHide:true});
if(result.error)throw result.error;if(result.status!==0)throw Error('Portable ZIP creation failed');
await fs.writeFile(`${zip}.sha256`,`${sha(await fs.readFile(zip))}  ${path.basename(zip)}\n`);
console.log(JSON.stringify({folder:output,archive:zip,bytes:(await fs.stat(zip)).size,files:Object.keys(files).length+1,dependencies:seen.size},null,2));
