import {spawnSync} from 'node:child_process';
for (const script of ['tests/electron-smoke.mjs','tests/recovery-smoke.mjs','tests/fog-smoke.mjs','tests/canvas-navigation-smoke.mjs','tests/stars-smoke.mjs','tests/canvas-editing-smoke.mjs']) {
  const result = spawnSync(process.execPath,[script],{stdio:'inherit'});
  if (result.status !== 0) process.exit(result.status ?? 1);
}
