import path from 'node:path';

// Source, dependencies and test output live separately from downloadable files.
export const sourceRoot=path.resolve(import.meta.dirname,'..');
export const applicationRoot=path.resolve(sourceRoot,'..');
const installationRoot=path.join(applicationRoot,'Для установки');
// Select separate clean output without replacing an installed copy containing Data.
export const releaseRoot=process.env.ALERT_STUDIO_RELEASE_DIR?path.resolve(installationRoot,process.env.ALERT_STUDIO_RELEASE_DIR):installationRoot;
const relative=path.relative(installationRoot,releaseRoot);
if(path.isAbsolute(relative)||relative==='..'||relative.startsWith('..'+path.sep))throw Error('Release output must stay inside «Для установки»');
