# Developing the linked composition

[Русский](<../reference-fog-stars-lines-plan.md>) · [English](<reference-fog-stars-lines-plan.md>) · [Contents](<README.md>)

This area combines fog, small/large stars and network within AlertStudio's own architecture. The first version already includes sources, shared clocks, example scene, inherited regions, density/masks/topology. This page distinguishes extensions from working features.

Visual target: 1920×1080, 900×480 cloud, four fog layers, 1900/70 stars and a large-star network. Reference settings start artistic comparison, not mandatory formulas. Flying/flow and Edge Light are investigated separately rather than disguised as network behavior.

Future tasks follow [overall priorities](development-plan.md): multiple UUID sources/weights; more fog shapes/structures/movements/two-color/erosion; flying/flow and star variants; shared wind/vortex/collisions; curved network edges/endings/motion; separate Dark Base/Edge Light. A nonvisual region and exact noise-density sampler need explicit decisions rather than substituting current fog output.

Preserve independent instances/values, hidden sources, deleted/wrong-type/cycle diagnostics, separate z-order/graph, deterministic seeks, shared clocks and undo. Group cloning with link remapping, presets and migrations remain needed.

Acceptance: no silent source breaks; reproducible direct seeks; geometry survives save/open; all four stages display correctly; renderers dispose resources; RU/EN, 900×650/1920×1080 and bounded budgets are checked. Focused reference comparison does not require pixel parity. See [current behavior](linked-scene.md).
