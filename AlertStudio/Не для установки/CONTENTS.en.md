# What belongs in the application

[Русский](<СОДЕРЖИМОЕ.md>) · [English](<CONTENTS.en.md>)

| Folder in parent AlertStudio | Contents | Distribution |
|---|---|---|
| Для установки (For installation) | Portable AlertStudio-&lt;version&gt;-Windows-x64 folder, ZIP and SHA-256 | Download the ZIP from GitHub Releases; the extracted folder runs independently |
| Не для установки (Not for installation) | Everything needed for development/checks rather than running the finished app | Excluded from the runnable ZIP |

## This development folder

Для установки/Чистая сборка contains the new clean archive with separate RU/EN instructions. The installed application folder with personal Data remains in its original location.

- adapters, app, contracts, core, locales, modules, sdk, ui-kit and index.html: source compiled into the application.
- tools, package.json, lock/workspace files, tsconfig.json, .gitattributes and AGENTS: development tools and rules.
- node_modules: developer dependencies; dist: intermediate builds and example extension packages.
- tests, .test-data and artifacts: tests, test projects, reports and screenshots.
- docs, README, examples, reference and output: documentation, comparison PDFs, examples and references.
- tmp: temporary files; Launch.exe/.cmd/.ps1: development launchers. Users run the portable AlertStudio.exe.

Not for installation does not mean never sent to GitHub: sources, tests and documentation belong in the development repository. Local dependencies and generated output are ignored by Git. Neither sources nor local output enter the runnable Release ZIP.

The portable app creates its own Data beside the EXE for settings, projects, extensions and drafts. Move that Data with your installed app, but never bundle it for other users. Do not move personal Data into the development folder during updates.

Run pnpm here. package:portable writes clean files to sibling Для установки and refuses to replace a distribution containing Data/modified files. Releases receive ZIP/SHA only. The hidden root .gitignore is Git administration, not an application file. See [documentation](docs/en/README.md).
