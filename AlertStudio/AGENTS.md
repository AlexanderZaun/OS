# AlertStudio

Work only inside this folder. Preserve ../smoke-configured.html and ../prompt-ru.md.
Core, contracts and sdk/index.ts are platform independent: no React, Electron, Dockview, Canvas, Pixi or FFmpeg imports. Framework imports belong in adapters, bootstrap or explicit UI contracts.
Run pnpm typecheck, pnpm check:boundaries, pnpm test, pnpm build and pnpm test:ui for relevant changes. UI checks require Windows desktop execution.
Keep setting definitions and saved values in separate files. Never replace folder projects with a single JSON payload.
All platform labels have RU/EN keys. SDK is experimental 0.1; schema, behavior and project versions are independent. Do not claim planned or untested behavior works.
Runtime extensions must be separately built, installed via staging and validated again before activation. No executable project contents are loaded.
