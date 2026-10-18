# AlertStudio development instructions

[Русский](<AGENTS.md>) · [English](<AGENTS.en.md>)

## Scope and layout

Work only inside the parent AlertStudio folder. Sources/tooling live here in Не для установки; runnable application/ZIP/SHA live in sibling Для установки. Use tools/distribution-paths.mjs rather than fixed drive letters. Keep development material out of the runnable tree. Preserve ../../smoke-configured.html and ../../prompt-ru.md. Root .gitignore excludes Для установки; sources here are published separately.

## Architecture and data

For authorized GitHub presentation work, repository-root README.md/README.en.md are the public application entry points. Maintain them alongside presentation and docs/en/github-presentation.md; do not move/delete other external files. The application website is deployed separately through GitHub Pages; the Code source tree remains available.

- Core, contracts and sdk/index.ts are independent of React/Electron/Dockview/Canvas/Pixi/FFmpeg. Framework code belongs in adapters/bootstrap or explicitly specialized UI contracts.
- Setting definitions and saved values stay in separate files. Never replace folder projects with one JSON payload.
- Recovery stays outside the explicit project folder. Never call autosave explicit Save. Keep Windows folder leases for the whole session; do not replace them with stale lock-file deletion. Validate complete backup trees before fallback.
- Runtime extensions are built separately, installed through staging and revalidated before activation. Projects never execute code.
- SDK 0.1 is experimental; schema, behavior and project versions are independent. Never describe planned or untested behavior as working.

## UI, languages and checks

All platform labels need RU/EN. New controls/panels use ui-kit/theme.css and dialogs use ui-kit/Dialog.tsx, without a separate palette. Follow docs/en/design-system.md. For UI changes inspect 900×650 and 1920×1080.

For relevant changes run pnpm typecheck, pnpm check:boundaries, pnpm test, pnpm build and pnpm test:ui. UI checks require Windows desktop. For portable changes add pnpm package:portable and pnpm test:portable. For documentation run pnpm check:docs; maintain substantive RU/EN parity, working links and current statuses. Russian docs live in docs/, English docs in docs/en/; root pairs are README.md/README.en.md, AGENTS.md/AGENTS.en.md and СОДЕРЖИМОЕ.md/CONTENTS.en.md. Run commands from this folder.

## Runnable GitHub distribution

For authorized publication ship current source AND a tested self-contained Windows portable ZIP with SHA-256 in Releases. A source ZIP or backup tag does not deliver the application. Follow docs/en/portable.md: package:portable, test:portable, commit, annotated version/backup tags, explicit atomic push, then tools/github-release.mjs. New releases must use an unpublished version.

Exclude node_modules, Data, drafts, project backups, logs, tests, artifacts and references from the runnable ZIP. Preserve licenses and both RU/EN user guides. Packaged storage follows the EXE under Data regardless of cwd, developer profile and drive. Never overwrite a Release or a folder containing user data.

## Source checkpoints — user requirement

For every authorized publication create an annotated backup tag for the published commit. Before updating the branch, preserve its previous remote tip if no backup tag already points to it. Use unique backup/date-description names dated in Europe/Minsk; add a time/suffix for multiple publications per day.

Never move/overwrite/delete published backup refs or rewrite history to replace them. Push the branch and explicitly named new tags atomically when possible; verify remote commit targets. Report the commit and backup tags to the user. This rule does not authorize unsolicited pushes or automation. See docs/en/backups.md.
