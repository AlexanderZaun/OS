import {spawnSync} from 'node:child_process';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
export function git(args,input){const result=spawnSync('git',args,{cwd:root,input,encoding:'utf8',env:{...process.env,GIT_TERMINAL_PROMPT:'0',GCM_INTERACTIVE:'never',GCM_GUI_PROMPT:'false'},windowsHide:true});if(result.status!==0)throw Error(`git ${args[0]} failed`);return result.stdout.trim();}
const remote=new URL(git(['remote','get-url','origin']));
if(remote.hostname!=='github.com'||remote.protocol!=='https:')throw Error('Expected HTTPS GitHub origin');
export const repository=remote.pathname.replace(/^\//,'').replace(/\.git$/,'');
if(!/^[\w.-]+\/[\w.-]+$/.test(repository))throw Error('Invalid repository');
let token=process.env.GH_TOKEN??process.env.GITHUB_TOKEN;
if(!token){const credential=git(['credential','fill'],'protocol=https\nhost=github.com\n\n');token=credential.split('\n').find(line=>line.startsWith('password='))?.slice(9);}
export async function api(endpoint,{method='GET',data,allow404=false}={}){
  const response=await fetch(`https://api.github.com/repos/${repository}${endpoint}`,{method,headers:{'User-Agent':'AlertStudio-project-presentation','X-GitHub-Api-Version':'2022-11-28',Accept:'application/vnd.github+json',...(token?{Authorization:`Bearer ${token}`}:{}) ,...(data?{'Content-Type':'application/json'}:{})},body:data?JSON.stringify(data):undefined});
  if(allow404&&response.status===404)return null;
  if(!response.ok)throw Error(`GitHub ${method} ${endpoint}: HTTP ${response.status}`);
  return response.status===204?null:response.json();
}
