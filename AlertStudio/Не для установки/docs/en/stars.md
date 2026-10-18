# Star field

[Русский](<../stars.md>) · [English](<stars.md>) · [Contents](<README.md>)

Built-in stars 0.1.0 has 48 definitions and small/large creation templates. Controls include independent fields and fields linked to one fog source, region/rotation, seeded count 0–5000, color/palette, core/halo, shapes, twinkling, movement, billow attachment, glints and short analytical trails.

Increasing count preserves the existing star prefix. Independent-field drift wraps within the region and fades at edges; depth changes speed. Cloud mode inherits geometry and uses contour or density placement; attachment uses billow rest positions. Seeking is independent of frame order. Zero count/opacity gives empty output.

The renderer uses bounded sprite caches rather than a full-size surface per star; dispose releases caches. Network receives the same current/rest positions and separate densityAlpha, so ordinary twinkling does not rebuild its graph.

Ring/bokeh, individual symbol angle, velocity alignment, per-star hue/saturation scatter, flying/flow, multiple sources and long history trails are not implemented. Layer-wide hue/saturation already exists but is not randomized star color. See [sources](linked-scene.md) and [density](fog-density.md).
