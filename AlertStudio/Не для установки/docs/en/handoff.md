# Continuing development

[Русский](<../handoff.md>) · [English](<handoff.md>) · [Contents](<README.md>)

## Current checkpoint

Version 0.2.1 includes the new folder layout, RU/EN documentation and GitHub Pages application presentation. Source is checkpointed by v0.2.1 and backup/2026-10-18-presentation-v0.2.1. Previous v0.2.0/9dc7d2d and its assets remain intact. Public READMEs are at repository root; detailed developer guides remain here.

Не для установки contains all source/tools/tests/artifacts. Run commands here. Для установки is the sibling output selected by tools/distribution-paths.mjs. After relocation, 95 node_modules junctions and pnpm virtualStoreDir were repaired. Old C:/Life/OS/AlertStudio paths without the nested folder are not the current development cwd.

Implemented: four basic workspaces/fades, common layer styles and PNG, lock/Solo/tags, search/changed/reset, scoped copy/paste and visible history. History initially opens as a Properties-adjacent tab; session clipboard/history are not in Project. Geometry, multi-source, new artistic systems and advanced stages remain future work.

## Code map

- Main Projects is authoritative; ProjectSession coordinates save/recovery/leases.
- Source graph: core/scene/evaluate.ts; neutral geometry/density: core/geometry.
- Desktop/preload/portable: adapters/desktop-electron; compositing/PNG: adapters/render-canvas2d.
- Workspace: adapters/workspace-dockview; properties/catalog/history: modules/panels.
- Shared tokens/Dialog: ui-kit; packaging/publication: tools.

## Before the next stage

Documentation now has 59 RU/EN pairs and two plain-text guides; check:docs is included in pnpm check. Earlier text is preserved locally; current pages are ordinary editable Markdown without a generator dependency. A clean ZIP with both guides was built under Для установки/Чистая сборка because the previous installed folder contains Data. Select it with ALERT_STUDIO_RELEASE_DIR='Чистая сборка' in the current terminal; packaging, portable tests and the release tool share the helper. pnpm check and the new C:→E: portable run passed. Future publication combines Russian and English release notes; the presentation is included in release 0.2.1.

Read [priorities](development-plan.md), [AGENTS](../../AGENTS.en.md), [architecture](architecture.md) and [verification](verification.md). The next agreed area is geometry/scene, not audio or external services. Basic intro/outro already exist; advanced per-object animation needs agreed behavior.

Maintain documentation pairs together; pnpm check:docs checks coverage and links. Full application run: 81 tests/22 UI, build/portable/C:→E:. Publishing requires a new version, explicit authorization and the [portable](portable.md)/[backup](backups.md) procedure.
