# Requirements status

[Русский](<../requirements.md>) · [English](<requirements.md>) · [Contents](<README.md>)

Updated for 0.2.0 on 18 October 2026. Partial means a tested subset, not full completion. The original request remains outside the application at ../../prompt-ru.md; development-plan.md defines current priorities.

| Area | Status |
|---|---|
| Panels/SDK | Built-ins, separately installed project-info/orbit, shared model and windows tested; SDK experimental |
| Effects/sources | Fog/stars/network, UUID sources, regions, density/masks/topology work; other effects and multi-source remain planned |
| Storage | Multi-file revisions, exact versions, unknown values, backup index, leases and Recovery tested for process failures |
| RU/EN UI | Dictionaries/labels and switching work; complete accessibility/localization audit not passed |
| Four workspaces | Shared composition, durations and group fade work; overrides/keyframes/montage absent |
| Layers/properties | Rename/reorder, lock/Solo/tags, blend/clip/color, search/reset/copy/history work |
| Canvas | Zoom/pan/fit/select/drag work; resize/rotate handles, snapping and multiple selection absent |
| Export | Transparent current-frame PNG works; PNG sequence/WebM/GIF/audio export absent |
| Presets/assets | Example and creation templates work; user library/migrations/assets remain needed |
| Portable application | Self-contained Windows x64 ZIP published; C: → E: relocation tested; another PC/OS not tested |
| Performance | Limited harness/storage measurements exist; no complete p95/p99/peak-memory/GPU/export audit |
| Integrations/audio | Not implemented; external services are outside near-term scope |

Full studio acceptance has not passed. A source ZIP, visible button or successful build alone does not prove functionality. See [verification](verification.md), [priorities](development-plan.md) and [detailed catalog](feature-catalog-ru.md).
