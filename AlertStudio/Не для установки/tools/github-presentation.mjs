import {promises as fs} from 'node:fs';
import path from 'node:path';
import {api,repository,git} from './github-api.mjs';
const source=path.resolve(import.meta.dirname,'..'),branch='codex/alertstudio-pages';
const repo=await api(''),pages=await api('/pages',{allow404:true});
if(process.argv.includes('--inspect')){
 const release=await api('/releases/latest',{allow404:true});
 console.log(JSON.stringify({repository,name:repo.name,description:repo.description,homepage:repo.homepage,private:repo.private,permissions:repo.permissions,pages:pages?{url:pages.html_url,status:pages.status,source:pages.source}:null,release:release?{tag:release.tag_name,url:release.html_url,assets:release.assets.map(a=>({name:a.name,size:a.size}))}:null},null,2));
}else if(process.argv.includes('--deploy')){
 if(!repo.permissions?.admin)throw Error('Repository administrator permission is required for Pages');
 if(pages&&pages.source?.branch!==branch)throw Error('Existing Pages configuration belongs to another source; refusing to replace it');
 const head=git(['rev-parse','HEAD']),remote=git(['ls-remote','origin',`refs/heads/${repo.default_branch}`]).split(/\s+/)[0];
 if(head!==remote||git(['status','--porcelain','--untracked-files=no']))throw Error('Commit and push the tested source before deployment');
 const pkg=JSON.parse(await fs.readFile(path.join(source,'package.json'),'utf8'));
 const release=await api('/releases/latest');if(release.tag_name!==`v${pkg.version}`)throw Error('Publish the matching runnable release before deployment');
 const expected=`/releases/download/v${pkg.version}/AlertStudio-${pkg.version}-Windows-x64.zip`;
 for(const file of ['index.html','en/index.html'])if(!(await fs.readFile(path.join(source,'presentation',file),'utf8')).includes(expected))throw Error('Rebuild the website for the current release');
 const site=path.join(source,'presentation'),files=[];
 async function walk(dir){for(const entry of await fs.readdir(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isSymbolicLink())throw Error('Site symlinks are not allowed');if(entry.isDirectory())await walk(file);else if(entry.isFile())files.push(file);}}
 await walk(site);const tree=[];
 for(const file of files){const relative=path.relative(site,file).replaceAll('\\','/');if(!/^(?:index\.html|en\/index\.html|style\.css|\.nojekyll|assets\/[a-z-]+\.(?:png|svg))$/.test(relative))throw Error(`Unexpected site file: ${relative}`);const bytes=await fs.readFile(file);const blob=await api('/git/blobs',{method:'POST',data:{content:bytes.toString('base64'),encoding:'base64'}});tree.push({path:relative,mode:'100644',type:'blob',sha:blob.sha});}
 const old=await api(`/git/ref/heads/${branch}`,{allow404:true}),createdTree=await api('/git/trees',{method:'POST',data:{tree}});
 const commit=await api('/git/commits',{method:'POST',data:{message:`Publish AlertStudio ${pkg.version} application website`,tree:createdTree.sha,parents:[old?.object.sha??head]}});
 if(old)await api(`/git/refs/heads/${branch}`,{method:'PATCH',data:{sha:commit.sha,force:false}});
 else await api('/git/refs',{method:'POST',data:{ref:`refs/heads/${branch}`,sha:commit.sha}});
 if(!pages)await api('/pages',{method:'POST',data:{build_type:'legacy',source:{branch,path:'/'}}});
 const published=await api('/pages');console.log(JSON.stringify({url:published.html_url,status:published.status,branch,sourceCommit:head,siteCommit:commit.sha,files:tree.length},null,2));
}else if(process.argv.includes('--activate')){
 if(!pages||pages.source?.branch!==branch)throw Error('The tested application website has not been configured');
 const pkg=JSON.parse(await fs.readFile(path.join(source,'package.json'),'utf8')),siteUrl=pages.html_url.replace(/\/?$/,'/');
 for(const suffix of ['', 'en/']){const response=await fetch(new URL(suffix,siteUrl));if(!response.ok||!(await response.text()).includes(`/releases/download/v${pkg.version}/AlertStudio-${pkg.version}-Windows-x64.zip`))throw Error('Wait for the current RU/EN website to finish building');}
 const updated=await api('',{method:'PATCH',data:{description:'AlertStudio — офлайн-редактор графики уведомлений для Windows. Text, fog, stars and networks. Portable app, RU/EN, transparent PNG.',homepage:pages.html_url}});
 const existing=await api('/topics'),names=[...new Set([...(existing.names??[]),'alertstudio','windows','portable','offline','graphics-editor','stream-alerts','canvas2d'])];
 await api('/topics',{method:'PUT',data:{names}});
 console.log(JSON.stringify({description:updated.description,homepage:updated.homepage,private:updated.private,topics:names},null,2));
}else throw Error('Use --inspect, --deploy or --activate');
