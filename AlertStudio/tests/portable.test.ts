import {test} from 'node:test';
import assert from 'node:assert/strict';
import {promises as fs} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {preparePortable,portablePaths,portableProjectFolder} from '../adapters/desktop-electron/portable';
import {RecoveryStore} from '../adapters/storage-files/recovery';
import {Projects} from '../core/project/service';
import {textEffect} from '../modules/effects/text/src/register';

test('Portable storage follows executable, prepares writable directories and contains project names',async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'alert-portable-paths-'));
  const paths=preparePortable(path.join(root,'AlertStudio.exe'));
  assert.equal(paths.profile,path.join(root,'Data','Profile'));
  for(const folder of [paths.projects,paths.recovery,paths.extensions,paths.logs,paths.crashes])assert.ok((await fs.stat(folder)).isDirectory());
  assert.ok(!(await fs.readdir(paths.data)).some(name=>name.startsWith('.write-check')));
  const project=portableProjectFolder(paths.projects,'../../CON: name...','project-id');
  assert.equal(path.dirname(project),paths.projects);assert.ok(!path.basename(project).includes(':'));
  assert.throws(()=>portableProjectFolder(paths.projects,'name','../escape'));
  assert.equal(portablePaths(path.join(root,'moved','AlertStudio.exe')).data,path.join(root,'moved','Data'));
  const blocked=path.join(root,'blocked');await fs.mkdir(blocked);await fs.writeFile(path.join(blocked,'Data'),'file');
  assert.throws(()=>preparePortable(path.join(blocked,'AlertStudio.exe')));
});

test('Portable recovery rebases internal projects after moving the complete folder and rejects escaping paths',async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'alert-portable-recovery-'));
  const before=path.join(root,'before'),after=path.join(root,'after');
  const paths=preparePortable(path.join(before,'AlertStudio.exe'));
  const model=new Projects(()=>[textEffect]);model.dispatch({type:'add',effect:'text'});const project=model.snapshot().project;
  const origin=portableProjectFolder(paths.projects,project.name,project.id);
  await new RecoveryStore(paths.recovery,undefined,before).save(project,origin);
  const meta=path.join(paths.recovery,project.id,'recovery.json');
  const metadata=JSON.parse(await fs.readFile(meta,'utf8'));
  assert.equal(metadata.origin,null);assert.ok(metadata.originRelative.startsWith('Data/Projects/'));
  await fs.rename(before,after);
  const moved=portablePaths(path.join(after,'AlertStudio.exe')),store=new RecoveryStore(moved.recovery,undefined,after);
  assert.equal((await store.list())[0].origin,path.join(after,path.relative(before,origin)));
  assert.deepEqual(await store.open(project.id),project);
  for(const unsafe of ['../escape','/outside','C:/outside','Data//bad','Data/../bad','Data\\bad']){
    await fs.writeFile(path.join(moved.recovery,project.id,'recovery.json'),JSON.stringify({...metadata,originRelative:unsafe}));
    assert.deepEqual(await store.list(),[]);
  }
  const external=path.join(root,'external-project');await store.save(project,external);
  assert.equal((await store.list())[0].origin,external);
});
