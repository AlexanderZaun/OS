# AlertStudio

Work only inside this folder. Preserve ../smoke-configured.html and ../prompt-ru.md.
Core, contracts and sdk/index.ts are platform independent: no React, Electron, Dockview, Canvas, Pixi or FFmpeg imports. Framework imports belong in adapters, bootstrap or explicit UI contracts.
Run pnpm typecheck, pnpm check:boundaries, pnpm test, pnpm build and pnpm test:ui for relevant changes. UI checks require Windows desktop execution.
Keep setting definitions and saved values in separate files. Never replace folder projects with a single JSON payload.
All platform labels have RU/EN keys. SDK is experimental 0.1; schema, behavior and project versions are independent. Do not claim planned or untested behavior works.
Use ui-kit/theme.css tokens for every new panel/dialog/control; do not introduce a separate palette. Dialogs use ui-kit/Dialog.tsx. Follow docs/design-system.md and visually inspect 900x650 and 1920x1080 when changing layout.
Recovery drafts must remain outside the explicit project folder. Keep Windows folder leases for the whole editing session; do not replace them with stale lock-file deletion. Validate backup trees before fallback. Never call autosave an explicit Save.
Runtime extensions must be separately built, installed via staging and validated again before activation. No executable project contents are loaded.

## Runnable GitHub distribution

For authorized GitHub publication, publish current source AND a tested self-contained Windows portable ZIP with its SHA-256 file in GitHub Releases. A source ZIP or backup tag alone does not deliver the program. Follow docs/portable.md: pnpm package:portable, pnpm test:portable, commit, annotated version/backup tags, explicit atomic push, then node tools/github-release.mjs. Never upload node_modules, Data, recovery drafts, project backups, logs, tests, artifacts or development references into the runnable archive. Preserve runtime licenses. Packaged storage must follow the executable under Data, independent of the working directory, developer profile and drive letter. Never overwrite an existing release or a distribution folder containing user data.

## GitHub publication backups (user requirement)

For every future user-authorized publication to GitHub, preserve an annotated backup tag for the version being published. Before updating the remote branch, also preserve its previous tip under a backup tag if no backup tag already points to that commit. Use unique descriptive names under backup/ with the publication date; use the user's Europe/Minsk timezone and add a time or suffix for multiple publications on the same day. Never move or overwrite existing backup tags, delete published backup refs, or rewrite published history to replace a backup. Push the branch and the explicitly named new backup tags, preferably atomically, then verify their remote commit targets. Report the published commit and backup tags to the user. See docs/backups.md. This rule applies when publication is authorized; it does not authorize unsolicited pushes or scheduled automation.
