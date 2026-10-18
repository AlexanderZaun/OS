# Portable application and releases

[Русский](<../portable.md>) · [English](<portable.md>) · [Contents](<README.md>)

## Usage

Windows 10/11 x64. Download the ZIP from [Releases](https://github.com/AlexanderZaun/OS/releases/latest), extract it completely into a writable folder and run AlertStudio.exe. Node.js/pnpm/network access are not required for normal use. Code → Download ZIP contains source.

First launch creates Data beside the EXE: Profile for profile/layouts; Projects for initial Save; Recovery for separate drafts; Extensions for installed packages; Logs/CrashDumps for diagnostics. Save As can use an external folder. To relocate, close the app and move the whole folder including Data/DLL/locales/resources. Transfer external files separately. Paths containing spaces/Cyrillic were tested.

Update by extracting a fresh version and moving your Data while both apps are closed. Do not run inside ZIP or a read-only folder. The build has no separate AlertStudio publisher signature; Windows may show a download warning. Another physical computer and ARM/macOS/Linux remain untested.

## Development and contents

Run commands in Не для установки. tools/distribution-paths.mjs targets sibling Для установки. Packaging copies an explicit Electron runtime list, locales, bundled main/preload/UI, minimal package.json, READ-ME.ru.txt, READ-ME.en.txt, licenses and a SHA-256 inventory. Production dependencies are already bundled.

Source/tests/node_modules, references/PDFs, maps/logs/tmp/artifacts, Data and personal projects/backups are excluded. Git backup tags retain source history and never enter the ZIP. Inventory/ZIP hashes check integrity, not signatures. Rebuilding refuses to replace folders containing Data or modified files.

If an installed copy already contains Data, select separate output: $env:ALERT_STUDIO_RELEASE_DIR='Чистая сборка'. Packaging, portable tests and the release tool use this subfolder within Для установки; escaping that folder is rejected. The variable applies to the current terminal. The local build with separate RU/EN guides does not replace published 0.2.0, which has one combined bilingual guide.

~~~powershell
pnpm install --frozen-lockfile
pnpm check
pnpm test:ui
pnpm package:portable
pnpm test:portable
~~~

test:portable extracts the actual ZIP, launches the EXE with Windows/System32-only PATH and unrelated cwd, blocks DNS and checks Save/PNG/a detached window. It then moves a test copy to another drive, makes the old path unavailable and checks profile/layout/project/recovery/extension. E: is the default; ALERT_STUDIO_TEST_DRIVE selects another drive. Only its verified temporary test folder is removed. This is not a clean different-PC test.

## Publishing on request

Choose an unpublished version and update both release notes. After checks, commit source, create annotated version/unique backup tags, preserve the previous remote tip under the [rules](backups.md), explicitly push atomically and verify SHAs. Then node tools/github-release.mjs creates a draft, uploads ZIP/SHA, verifies sizes/hashes and publishes. Existing Releases are never overwritten. The script requires clean source, remote refs and portable-results matching the exact ZIP hash. --inspect only reads access/releases. Credentials come from Git Credential Manager or GH_TOKEN/GITHUB_TOKEN and are never printed.
