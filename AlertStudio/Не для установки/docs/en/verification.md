# Verification and evidence limits

[Русский](<../verification.md>) · [English](<verification.md>) · [Contents](<README.md>)

## Release 0.2.1 and public website — 18 October 2026

Passed pnpm check (61 RU/EN pairs, links, 218 items per language, TypeScript, 30 boundary files, 81 tests, build), the final complete 22/22 UI runner and test:portable against the exact 0.2.1 ZIP with C: → E: relocation. The first UI run stopped at Open in stars smoke; that test received the desktop pointer/CDP focus isolation used elsewhere, then both the standalone stars test and full runner passed. Application logic was not changed for the test.

Presentation checks cover 1440×1080, 900×650 and 390×844 in RU/EN: real editor screenshots, language navigation, local assets, download URLs and no horizontal overflow/page errors. website-ru/en-* screenshots were inspected. The runtime ZIP contains 82 files and both user guides; website/source/screenshots are excluded from the application ZIP. GitHub Pages and Releases are verified separately after publication.

## Last full application run — 18 October 2026

After the folder split, TypeScript, import boundaries (30 files), 81/81 functional tests, production build, 22/22 Electron UI scripts, packaging and test:portable passed. This verifies the current application checkpoint, not every hardware configuration. This documentation update additionally checks language pairs, local links and both user guides in the new ZIP.

Functional tests cover instance independence, validation, undo/history/paste, sources/cycles/seeking, density/topology/mask budgets, layers/styles, notification settings, PNG writes, filesystem faults/backups/leases and portable Recovery. The complete UI runner is tools/ui-tests.mjs, including panels, catalogs, cameras, stages, copy/history, extensions, open/save and closing.

## Portable application

The actual ZIP was extracted into its own test folder. Its real EXE launched from an unrelated cwd with Windows/System32-only PATH and blocked DNS; no application HTTP requests were recorded. Checks covered packaged paths, no renderer require, automatic Save without a picker, multi-file index, nonempty Canvas, PNG and detached Properties.

After installing orbit and saving a draft, the folder was copied C: → E: to a Cyrillic/space-containing path and the old path made unavailable. localStorage/layout, project open, relative Recovery origin, restore and extension activation survived. Only its own temporary E: directory is removed. The clean distribution remains without Data. Inventory checks files/hashes and excludes development material; AST-based require analysis distinguishes AJV string templates from executable imports.

## Artifacts and limitations

Documentation was checked separately: pnpm check:docs validated 59 RU/EN pairs, local links and 218 items per language; pnpm check passed again with 81/81 tests and a build. The new local ZIP under Для установки/Чистая сборка contains 82 files, including READ-ME.ru.txt and READ-ME.en.txt, and passed full test:portable with C: → E: relocation. The installed folder with Data was not replaced. The general UI runner was not repeated for this step because the interface did not change; its last result remains 22/22.

Reports live in artifacts/*-results.json and artifacts/portable-results.json; screenshots in artifacts/screenshots. The latest portable-900/1920 and compact/history/layer/stage screenshots were inspected. Artifacts remain local, outside distribution. Earlier detailed documentation records are preserved locally in tmp/docs-before-bilingual-2026-10-18; these are not new test results.

A different physical PC/clean VM, ARM/macOS/Linux, full HiDPI/screen-reader audit, physical touchscreen, multi-machine network shares, power loss, sustained load, peak memory and complete UI FPS are untested. The Playwright controller uses development tools; the tested EXE uses its ZIP libraries. Vite's large UI chunk warning remains and is not a build failure.
