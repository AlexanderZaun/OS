# Block 1. Fog and stars

[Русский](<../../plan/01-fog-and-stars.md>) · [English](<01-fog-and-stars.md>) · [Contents](<../README.md>)

Status in 0.2.0: First version implemented; extensions partial.

This is a requirements/proposal catalog, not a claim of full implementation or the current queue. Follow the [development plan](../development-plan.md). Original numbering is retained; topic pages explain partial progress. Every new area requires deterministic seeks, independent copies, save/open/undo/RU/EN, bounded resources and four-stage checks.

1. Artistic presets. Light haze, cold fog, dense smoke, stage steam and magic clouds; applying a preset changes selected-layer parameters and supports user variants.

2. Color zones. Base, highlight and deep-billow colors with balanced transitions that remain predictable on transparency.

3. Structure. Fine haze, large billows, fibers and stretched streams; detail scale independent of region size.

4. Flexible regions. Border fog, rings, bottom strips and arbitrary masks; region boundaries independent of billow softness.

5. Density profiles. Vertical gradients, edge concentration, patches and multiple openings without unexpectedly overriding color/opacity.

6. Complex motion. Gusts, waves, several swirl centers and breathing, evaluated reproducibly at an arbitrary time.

7. Appearance/disappearance. Edge growth, dissolve, traversal and filling with duration, delay and intensity curves; advanced per-effect behavior remains beyond group fade.

8. Internal light. Soft local glow, directional illumination and flicker, later linked to shared light sources.

9. Preview quality. Draft/normal/high modes and measured multi-layer cost; export quality must not change the composition.

10. Reference scenes. Light/dark backgrounds, strips, large clouds and overlapping layers; check edges, seeking, deletion and saving.

11. Star fields. Count 0–5000, region dimensions, seed, size variation and independent instances/copies are implemented.

12. Twinkle. Depth, speed, seeded phase/frequency and twinkling fraction are available; seeking remains reproducible.

13. Star shapes. Available core shapes and glints form the first version; arbitrary rays, thickness and individual rotation remain extensions.

14. Color and temperature. Single color and seeded warm/cool palettes exist; a free palette editor remains planned.

15. Core and halo. Independent core/halo controls and bounded sprite caches exist; broader styling remains planned.

16. Clusters and voids. Uniform/clustered and fog-density placement exist; galactic bands and arbitrary exclusion masks remain.

17. Drift and parallax. Speed, direction, depth variation and field rotation exist; individually editable depth planes remain.

18. Shooting stars. Seeded time-based frequency, paths, duration, tails and fading independent of real frame rate.

19. Constellations. Manual star links, labels and sequential appearance; links survive point movement.

20. Presets and load. 1000/5000-star harnesses and cache lifecycle are tested; sky/space/spark libraries and sustained-load tests remain.

[Catalog](../feature-catalog.md) · [Requirements](../requirements.md)
