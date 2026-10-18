import {promises as fs} from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),docs=path.join(root,'docs');
const problems=[],pairs=[['README.md','README.en.md'],['AGENTS.md','AGENTS.en.md'],['СОДЕРЖИМОЕ.md','CONTENTS.en.md']];
pairs.push(['../../README.md','../../README.en.md']);
async function walk(folder){const found=[];for(const e of await fs.readdir(folder,{withFileTypes:true})){const file=path.join(folder,e.name);if(e.isDirectory())found.push(...await walk(file));else if(e.name.endsWith('.md'))found.push(file);}return found;}
const files=await walk(docs),russian=files.filter(f=>!path.relative(docs,f).startsWith('en'+path.sep));
for(const file of russian)pairs.push([path.relative(root,file),path.join('docs','en',path.relative(docs,file))]);
const expectedEnglish=new Set(pairs.map(([,en])=>path.resolve(root,en)));
for(const file of files)if(path.relative(docs,file).startsWith('en'+path.sep)&&!expectedEnglish.has(file))problems.push(`English page has no Russian pair: ${path.relative(root,file)}`);
const contents=new Map();
for(const [ru,en]of pairs){
  const bodies=[];
  for(const name of [ru,en]){try{const text=await fs.readFile(path.join(root,name),'utf8');contents.set(name,text);bodies.push(text);if(!text.startsWith('# '))problems.push(`${name}: missing title`);if(!/^\[Русский\].*\[English\]/m.test(text))problems.push(`${name}: missing language switch`);}catch{problems.push(`Missing documentation: ${name}`);}}
  if(bodies.length===2&&bodies[0]===bodies[1])problems.push(`${en}: untranslated identical copy`);
}
for(const [name,text]of contents){
  // Fenced samples are not navigation. Check local Markdown destinations, not web links.
  const prose=text.replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[^\n]*$/gm,'');
  for(const match of prose.matchAll(/!?\[[^\]\n]*\]\((?:<([^>]+)>|([^\s)]+))(?:\s+"[^"]*")?\)/g)){
    const href=match[1]??match[2];if(/^[a-z][a-z0-9+.-]*:/i.test(href)||href.startsWith('#'))continue;
    let target;try{target=decodeURIComponent(href.split(/[?#]/)[0]);}catch{problems.push(`${name}: malformed link ${href}`);continue;}
    if(!target)continue;
    try{await fs.access(path.resolve(root,path.dirname(name),target));}catch{problems.push(`${name}: broken link ${href}`);}
  }
  if(/<(?:id|uuid|key|version|inventory-path|версия)>/.test(prose))problems.push(`${name}: unescaped path placeholder`);
}
const pkg=JSON.parse(await fs.readFile(path.join(root,'package.json'),'utf8'));
for(const language of ['ru','en']){
  const name=`READ-ME.${language}.txt`;try{const text=await fs.readFile(path.join(docs,name),'utf8');if(!text.includes(`AlertStudio ${pkg.version}`)||!text.includes('AlertStudio.exe')||!text.includes(`READ-ME.${language==='ru'?'en':'ru'}.txt`))problems.push(`${name}: outdated or incomplete portable guide`);}catch{problems.push(`Missing portable guide: ${name}`);}
}
const numbered=async lang=>{const ids=[];for(const file of files.filter(f=>path.relative(docs,f).startsWith(lang?`en${path.sep}plan${path.sep}`:`plan${path.sep}`))){const text=await fs.readFile(file,'utf8');ids.push(...[...text.matchAll(/^(\d+)\. /gm)].map(m=>Number(m[1])));}return ids.sort((a,b)=>a-b);};
const expected=Array.from({length:218},(_,i)=>i+1);
for(const language of ['', 'en'])if(JSON.stringify(await numbered(language))!==JSON.stringify(expected))problems.push(`${language||'ru'} catalog must preserve all 218 numbered items exactly once`);
if(problems.length){for(const problem of problems)console.error(problem);process.exitCode=1;}
else console.log(`Documentation: ${pairs.length} RU/EN pairs, local links, 218 catalog items per language and both portable guides checked`);
