import {spawnSync} from 'node:child_process';
import path from 'node:path';

if (process.platform === 'win32') {
  const compiler = path.join(process.env.WINDIR ?? 'C:\\Windows', 'Microsoft.NET', 'Framework64', 'v4.0.30319', 'csc.exe');
  const result = spawnSync(compiler, ['/nologo', '/target:winexe', '/optimize+', '/reference:System.Windows.Forms.dll', `/out:${path.resolve('Launch.exe')}`, path.resolve('tools/windows-launcher/Program.cs')], {stdio:'inherit', windowsHide:true});
  if (result.error) throw result.error;
  if (result.status !== 0) throw Error(`Windows launcher build failed (${result.status})`);
}
