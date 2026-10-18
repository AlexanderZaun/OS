# Fog masking for network lines

[Русский](<../line-mask.md>) · [English](<line-mask.md>) · [Contents](<README.md>)

Network can sample density along an entire segment, including an opening between visible endpoints. New example scenes enable a density mask at 70% strength. Source fog comes from the star source's runtime StarField.cloud, without another project-level network → fog link.

Controls cover mask mode, strength, step and threshold. Zero strength restores the previous image. The mask respects fog/star transforms and applies to colored lines, dash, glow and underlay. Losing the cloud field produces missing-mask rather than silently rebinding. Graph IDs/neighbors/endpoints remain unchanged.

The mask uses geometric density, not exact noise alpha. Limits are 32 samples per edge and 24000 per network/frame. Reaching the budget increases sampling step and shows a limit notice. Narrow openings can be missed; blur can extend into transparent regions. This is smooth alpha, not geometric line splitting or an FPS guarantee.

Checks cover interior fading with visible endpoints, independent transforms, budgets/missing masks, dash/glow/underlay, storage/legacy defaults and pixel seeking. See [density](fog-density.md) and [topology](network-topology.md).
