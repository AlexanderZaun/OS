import ts from 'typescript';
import {readdir,readFile} from 'node:fs/promises';
const roots=['core','contracts','sdk']; let count=0;
async function walk(folder){ for(const entry of await readdir(folder,{withFileTypes:true})){const p=`${folder}/${entry.name}`; if(entry.isDirectory())await walk(p); else if(/\.tsx?$/.test(p)){
  const ast=ts.createSourceFile(p,await readFile(p,'utf8'),ts.ScriptTarget.Latest,true); count++;
  function visit(node){ if((ts.isImportDeclaration(node)||ts.isExportDeclaration(node))&&node.moduleSpecifier&&ts.isStringLiteral(node.moduleSpecifier)){
    const source=node.moduleSpecifier.text;
    if(/^(electron|react|react-dom|dockview|pixi|ffmpeg)|adapters\//.test(source)&&p!=='sdk/ui.ts')throw Error(`Forbidden dependency: ${p} → ${source}`);
    if(p.startsWith('core/')&&/CanvasRenderingContext2D|document\.|window\./.test(node.getText(ast)))throw Error(`DOM in ${p}`);
  } ts.forEachChild(node,visit); }visit(ast);
}}}
for(const root of roots)await walk(root); console.log(`Import boundaries: ${count} files checked`);
