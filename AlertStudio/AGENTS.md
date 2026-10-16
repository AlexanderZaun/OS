# AlertStudio

Work only inside this folder. Preserve ../smoke-configured.html and ../prompt-ru.md.
Core, contracts and sdk/index.ts are platform independent: no React, Electron, Dockview, Canvas, Pixi or FFmpeg imports. Framework imports belong in adapters, bootstrap or explicit UI contracts.
Run pnpm typecheck, pnpm check:boundaries, pnpm test, pnpm build and pnpm test:ui for relevant changes. UI checks require Windows desktop execution.
Keep setting definitions and saved values in separate files. Never replace folder projects with a single JSON payload.
All platform labels have RU/EN keys. SDK is experimental 0.1; schema, behavior and project versions are independent. Do not claim planned or untested behavior works.
Use ui-kit/theme.css tokens for every new panel/dialog/control; do not introduce a separate palette. Dialogs use ui-kit/Dialog.tsx. Follow docs/design-system.md and visually inspect 900x650 and 1920x1080 when changing layout.
Recovery drafts must remain outside the explicit project folder. Keep Windows folder leases for the whole editing session; do not replace them with stale lock-file deletion. Validate backup trees before fallback. Never call autosave an explicit Save.
Runtime extensions must be separately built, installed via staging and validated again before activation. No executable project contents are loaded.
