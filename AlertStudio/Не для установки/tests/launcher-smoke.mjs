import {chromium, expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {createServer} from 'node:net';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';

if (process.platform === 'win32') {
  const launcher = path.resolve('Launch.exe');
  const executable = await readFile(launcher);
  const pe = executable.readUInt32LE(0x3c);
  assert.equal(executable.readUInt16LE(pe + 24 + 68), 2, 'Launcher must use the Windows GUI subsystem');
  const data = path.resolve(`.test-data/launcher-${randomUUID()}`);
  await mkdir(data, {recursive:true});
  const server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  const child = spawn(launcher, [`--remote-debugging-port=${port}`, '--safe'], {
    cwd:tmpdir(), windowsHide:true,
    env:{...process.env, ALERT_STUDIO_DATA:data, ELECTRON_RUN_AS_NODE:'1'},
    stdio:'ignore'
  });
  await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', code => code === 0 ? resolve() : reject(Error(`Launcher exited ${code}`)));
  });
  let browser;
  try {
    let ready = false;
    for (let attempt = 0; attempt < 150; attempt++) {
      try {
        const response = await fetch(`http://127.0.0.1:${port}/json/version`, {signal:AbortSignal.timeout(500)});
        if (response.ok) {ready = true; break;}
      } catch {}
      await delay(200);
    }
    assert.ok(ready, 'Native launcher must start Electron');
    browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
    const page = browser.contexts()[0].pages()[0];
    await expect(page.getByRole('heading', {name:'Создайте следующий яркий момент.'})).toBeVisible();
    assert.equal(await page.evaluate(() => window.studio.snapshot()).then(s => s.project.objects.length), 0);
    await writeFile('artifacts/launcher-ui-results.json', JSON.stringify({date:new Date().toISOString(),
      tests:['GUI executable subsystem', 'launch from another working directory', 'clear ELECTRON_RUN_AS_NODE', 'forward --safe', 'welcome screen loads'], data}, null, 2));
    console.log('Native Windows launcher smoke passed');
  } finally {
    if (browser) {
      const cdp = await browser.newBrowserCDPSession();
      // Electron can exit before replying to Browser.close.
      await Promise.race([cdp.send('Browser.close').catch(() => {}), delay(500)]);
      await Promise.race([browser.close().catch(() => {}), delay(500)]);
    }
  }
}
