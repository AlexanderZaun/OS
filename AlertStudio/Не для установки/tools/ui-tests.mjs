import {spawnSync} from 'node:child_process';
for (const script of ['tests/copy-history-smoke.mjs','tests/settings-tools-smoke.mjs','tests/layer-editor-smoke.mjs','tests/layer-export-smoke.mjs','tests/compact-layout-smoke.mjs','tests/notification-workspace-smoke.mjs','tests/app-menu-smoke.mjs','tests/electron-smoke.mjs','tests/recovery-smoke.mjs','tests/fog-smoke.mjs','tests/canvas-navigation-smoke.mjs','tests/stars-smoke.mjs','tests/canvas-editing-smoke.mjs','tests/linked-scene-smoke.mjs','tests/shared-region-smoke.mjs','tests/close-smoke.mjs','tests/layers-smoke.mjs','tests/canvas-precision-smoke.mjs','tests/launcher-smoke.mjs','tests/object-templates-smoke.mjs','tests/catalog-workspace-smoke.mjs','tests/object-catalog-panel-smoke.mjs']) {
  const result = spawnSync(process.execPath,[script],{stdio:'inherit'});
  if (result.status !== 0) process.exit(result.status ?? 1);
}
