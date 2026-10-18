import {spawnSync} from 'node:child_process';
import {promises as fs} from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {verifyPortable} from './verify-portable.mjs';
const root=path.resolve(import.meta.dirname,'..');
function git(args,input){const result=spawnSync('git',args,{cwd:root,input,encoding:'utf8',env:{...process.env,GIT_TERMINAL_PROMPT:'0',GCM_INTERACTIVE:'never',GCM_GUI_PROMPT:'false'},windowsHide:true});if(result.status!==0)throw Error(`git ${args[0]} failed`);return result.stdout.trim();}
const remote=new URL(git(['remote','get-url','origin']));if(remote.hostname!=='github.com'||remote.protocol!=='https:')throw Error('Expected an HTTPS GitHub origin');
const repository=remote.pathname.replace(/^\//,'').replace(/\.git$/,'');if(!/^[\w.-]+\/[\w.-]+$/.test(repository))throw Error('Invalid repository');
let token=process.env.GH_TOKEN??process.env.GITHUB_TOKEN;
if(!token){try{const credential=git(['credential','fill'],`protocol=https\nhost=github.com\n\n`);token=credential.split('\n').find(line=>line.startsWith('password='))?.slice(9);}catch{}}
async function api(endpoint,{method='GET',data,bytes,accept='application/vnd.github+json',upload=false}={}){
  const host=upload?'uploads.github.com':'api.github.com',url=`https://${host}/repos/${repository}${endpoint}`;
  const response=await fetch(url,{method,headers:{'User-Agent':'AlertStudio-release-tool','X-GitHub-Api-Version':'2022-11-28',Accept:accept,...(token?{Authorization:`Bearer ${token}`}:{}) ,...(data?{'Content-Type':'application/json'}:{}),...(bytes?{'Content-Type':'application/octet-stream','Content-Length':String(bytes.length)}:{})},body:data?JSON.stringify(data):bytes});
  if(!response.ok)throw Error(`GitHub ${method} ${endpoint.split('?')[0]}: HTTP ${response.status}`);
  return accept==='application/octet-stream'?Buffer.from(await response.arrayBuffer()):response.json();
}
const repo=await api('');
if(process.argv.includes('--inspect')){const releases=await api('/releases?per_page=10');console.log(JSON.stringify({repository,authenticated:!!token,private:repo.private,defaultBranch:repo.default_branch,canPush:repo.permissions?.push??false,releases:releases.map(r=>({tag:r.tag_name,draft:r.draft,assets:r.assets.map(a=>a.name)}))},null,2));}
else{
  if(!token||!repo.permissions?.push)throw Error('GitHub write access is required');
  const pkg=JSON.parse(await fs.readFile(path.join(root,'package.json'),'utf8')),tag=`v${pkg.version}`,base=`AlertStudio-${pkg.version}-Windows-x64`;
  const inventory=await verifyPortable(path.join(root,'release',base));if(inventory.version!==pkg.version)throw Error('Distribution version mismatch');
  const assets=[`${base}.zip`,`${base}.zip.sha256`],contents=[];
  for(const name of assets)contents.push({name,bytes:await fs.readFile(path.join(root,'release',name))});
  const checksum=contents[1].bytes.toString('utf8').trim().split(/\s+/)[0];if(createHash('sha256').update(contents[0].bytes).digest('hex')!==checksum)throw Error('ZIP checksum mismatch');
  const commit=git(['rev-parse','HEAD']);if(git(['rev-list','-n','1',tag])!==commit)throw Error('Release tag must point to the current tested commit');
  if(git(['status','--porcelain','--untracked-files=normal','--','.']))throw Error('Commit the tested source before publishing');
  const refs=git(['ls-remote','origin',`refs/heads/${repo.default_branch}`,`refs/tags/${tag}^{}`,'refs/tags/backup/*^{}']).split('\n').map(line=>line.split(/\s+/));
  if(!refs.some(([sha,ref])=>sha===commit&&ref===`refs/heads/${repo.default_branch}`)||!refs.some(([sha,ref])=>sha===commit&&ref===`refs/tags/${tag}^{}`)||!refs.some(([sha,ref])=>sha===commit&&ref.startsWith('refs/tags/backup/')))throw Error('Push and verify the source branch, annotated release tag and backup tag first');
  const evidence=JSON.parse(await fs.readFile(path.join(root,'artifacts','portable-results.json'),'utf8'));
  if(evidence.sha256!==checksum||evidence.version!==pkg.version||evidence.errors.length||evidence.externalRequests.length)throw Error('Run portable acceptance against this exact ZIP before publishing');
  const body=await fs.readFile(path.join(root,'docs','release-notes.md'),'utf8');
  const releases=await api('/releases?per_page=100');if(releases.some(r=>r.tag_name===tag))throw Error('Release already exists; never overwrite published assets');
  const release=await api('/releases',{method:'POST',data:{tag_name:tag,name:`AlertStudio ${pkg.version} — Windows Portable`,body,draft:true,prerelease:false}});
  for(const asset of contents){
    const uploaded=await api(`/releases/${release.id}/assets?name=${encodeURIComponent(asset.name)}`,{method:'POST',bytes:asset.bytes,upload:true});
    const expected=createHash('sha256').update(asset.bytes).digest('hex');
    if(uploaded.size!==asset.bytes.length)throw Error('Uploaded asset size mismatch');
    if(uploaded.digest){if(uploaded.digest!==`sha256:${expected}`)throw Error('GitHub asset digest mismatch');}
    else{const downloaded=await api(`/releases/assets/${uploaded.id}`,{accept:'application/octet-stream'});if(createHash('sha256').update(downloaded).digest('hex')!==expected)throw Error('Uploaded asset hash mismatch');}
    console.log(`Verified asset: ${asset.name} (${uploaded.size} bytes)`);
  }
  const published=await api(`/releases/${release.id}`,{method:'PATCH',data:{draft:false,make_latest:'true'}});
  console.log(JSON.stringify({release:published.html_url,tag,commit,private:repo.private,assets:published.assets.map(a=>({name:a.name,url:a.browser_download_url,size:a.size}))},null,2));
}
