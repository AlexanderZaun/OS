# Procedural fog

[Русский](<../fog.md>) · [English](<fog.md>) · [Contents](<README.md>)

Built-in fog 0.1.0 has 36 separate definitions. modules/effects/fog/src/model.ts returns neutral billows with seeded parameters. Analytical wind/swirl reproduce arbitrary seeks without accumulated history. At 100% speed movement repeats over the configured period; speed scales the actual period inversely.

Controls cover independent/inherited regions, cloud/other shapes, rim/area/mixed placement, billow count, density, brightness/opacity, texture, contrast, stretch/tilt and an elliptical opening. Zero density/opacity produces empty output. Each UUID has independent local settings.

The Canvas renderer caches textures and masks. Draft/normal/high quality uses 256/384/768 surfaces and 64/96/192 textures respectively, bounded independently of scene size. The backend releases resources when the object disappears or its panel closes.

This is an original effect, not a copy of the HTML algorithm. One-way advection, GPU, multiple weighted sources for one consumer and a movement library remain future work. Scaling beyond the surface size softens detail. See [shared region](shared-fog-region.md), [density](fog-density.md) and [appearance](appearance-controls.md).
