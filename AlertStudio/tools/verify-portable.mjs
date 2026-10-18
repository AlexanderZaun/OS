import {promises as fs} from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import ts from 'typescript';
export async function verifyPortable(folder){
  const manifest=JSON.parse(await fs.readFile(path.join(folder,'distribution-manifest.json'),'utf8'));
  if(manifest.product!=='AlertStudio'||manifest.platform!=='win32'||manifest.architecture!=='x64'||typeof manifest.files!=='object')throw Error('Invalid distribution manifest');
  const found=[];
  async function walk(dir){for(const entry of await fs.readdir(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isSymbolicLink())throw Error('Distribution symlink');if(entry.isDirectory())await walk(file);else if(entry.isFile())found.push(path.relative(folder,file).split(path.sep).join('/'));else throw Error('Unknown distribution entry');}}
  await walk(folder);
  if(!manifest.files['AlertStudio.exe']||!manifest.files['resources/app/dist/desktop/main.cjs']||!manifest.files['resources/app/dist/desktop/preload.cjs']||!Object.keys(manifest.files).some(p=>p.startsWith('resources/app/dist/ui/assets/'))||!manifest.files['THIRD-PARTY-NOTICES.txt'])throw Error('Incomplete distribution');
  for(const file of found){
    if(file==='distribution-manifest.json')continue;
    if(/(^|\/)(Data|node_modules|\.git|\.test-data|tests|tmp|backups|reference)(\/|$)/i.test(file)||/\.(map|ts|tsx|log)$/i.test(file))throw Error(`Non-runtime file: ${file}`);
    if(!manifest.files[file])throw Error(`File outside inventory: ${file}`);
    const digest=createHash('sha256').update(await fs.readFile(path.join(folder,file))).digest('hex');if(digest!==manifest.files[file])throw Error(`Distribution hash mismatch: ${file}`);
  }
  if(found.length!==Object.keys(manifest.files).length+1)throw Error('Missing distribution files');
  const main=await fs.readFile(path.join(folder,'resources/app/dist/desktop/main.cjs'),'utf8');
  // Parse calls rather than AJV's string literals describing standalone code generation.
  const imports=[];
  function visit(node){if(ts.isCallExpression(node)&&ts.isIdentifier(node.expression)&&node.expression.text==='require'){
    if(node.arguments.length!==1||!ts.isStringLiteral(node.arguments[0]))throw Error('Dynamic runtime require');
    imports.push(node.arguments[0].text);
  }ts.forEachChild(node,visit);}
  visit(ts.createSourceFile('main.cjs',main,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS));
  if(imports.some(name=>name!=='electron'&&!name.startsWith('node:')))throw Error('Unbundled runtime dependency: '+imports.filter(name=>name!=='electron'&&!name.startsWith('node:')).join(','));
  return {version:manifest.version,files:found.length,bytes:(await Promise.all(found.map(file=>fs.stat(path.join(folder,file))))).reduce((sum,s)=>sum+s.size,0)};
}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(import.meta.filename))console.log(await verifyPortable(path.resolve(process.argv[2])));
