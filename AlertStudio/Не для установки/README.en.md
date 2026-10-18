# AlertStudio 0.2.1

[Русский](<README.md>) · [English](<README.en.md>)

An offline Windows x64 editor for notification graphics. Text, procedural fog, stars and networks form compositions with movable panels, history and transparent PNG export. This is a working experimental version, not a finished animation studio.

## Ready-to-run application

Download AlertStudio-0.2.1-Windows-x64.zip from [GitHub Releases](https://github.com/AlexanderZaun/OS/releases/latest), extract it completely into a writable folder and run AlertStudio.exe. Node.js, pnpm and dependency installation are not required. Code → Download ZIP contains development sources, not the runnable application.

To relocate, close the app and move the entire folder including Data. The first Save writes into Data/Projects; transfer external projects/exports separately. Update by extracting a fresh application folder and moving your Data while both versions are closed. [Detailed guide](docs/en/portable.md).

## Folders

| Section | Purpose |
|---|---|
| Для установки (For installation), beside this folder | Clean portable application, ZIP and SHA-256 |
| Не для установки (Not for installation), this folder | Sources, dependencies, tests, documentation and temporary data |

The second folder is excluded from the user ZIP. Its source and documentation still belong in GitHub for development; node_modules, artifacts, .test-data and tmp are ignored. [Complete contents](CONTENTS.en.md).

## Implemented

- Independent/linked object catalog with user classification and separate small/large star templates. One add creates one object; source selection comes first in Properties.
- Fog → stars → network, inherited fog regions, density, line masks, stable topology and an example scene.
- Four modes: main effect, intro, outro and assembly; shared clocks, durations and linear composition-wide fades.
- Zoom/pan/fit, selection/drag; lock, multi-Solo, tags; 13 blend modes, clipping, hue/saturation/opacity.
- RU/EN settings search, differences from defaults, reset, scoped copy/paste and up to 100 history steps shared across windows.
- Multi-file projects, undo/redo, separate recovery drafts, Windows folder leases and trusted runtime extensions.
- Transparent current-frame PNG with appearance and the selected stage.

Keyframes, advanced intro/outro, existing-scene resize, snapping, user preset libraries, WebM/GIF, audio and streaming integrations are absent. See [current priorities](docs/en/development-plan.md) and [requirements](docs/en/requirements.md).

## Development

Open a terminal in this Не для установки folder. Tested environment: Windows, Node 24.19.0 and pnpm 11.25.0; the build requires Node 22.12+.

~~~powershell
pnpm install --frozen-lockfile
pnpm build
pnpm start
~~~

Launch.exe here starts development with node_modules/dist; it is not the portable AlertStudio.exe. --safe disables external packages. Development's first Save asks for a folder; portable Save automatically uses Data/Projects. Closing dirty projects offers save/discard/cancel. See [closing and recovery](docs/en/closing.md).

## Checks and releases

~~~powershell
pnpm check
pnpm test:ui
pnpm package:portable
pnpm test:portable
~~~

Packaging writes to the sibling Для установки folder. Personal Data is neither bundled nor deleted by rebuilding. The last full application run passed 81 functional tests, 22 UI scripts and C: → E: portable relocation. A different physical computer and full HiDPI audit remain untested. See [verification](docs/en/verification.md).

Publishing requires an explicit request: source in Git, runnable ZIP/SHA in Releases and annotated version/backup tags. Old tags remain intact; personal backups stay outside the ZIP. See [rules](docs/en/backups.md).

[Documentation contents](docs/en/README.md) · [Developer/agent instructions](AGENTS.en.md) · [Continuing development](docs/en/handoff.md).
