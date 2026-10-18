# Shared fog region

[Русский](<../shared-fog-region.md>) · [English](<shared-fog-region.md>) · [Contents](<README.md>)

Fog may be independent or inherit another fog's region. Effective center, dimensions, rotation, shape and contour roughness are inherited. Color, density, brightness/opacity, softness, opening, texture, quality, billows and movement remain local.

Linked mode defines a source, world-space offsetX/Y, 1–400% scale and additional −360…360° rotation. Drag updates both offsets in one patch/undo, including the mouse-release position. Chains multiply scales and add rotations/world offsets; offsets are not rotated/scaled by their source.

Returning to independent mode restores saved local values; links/relative settings remain stored. Baking effective geometry into local values is not implemented. In the example scene fog 2/3/4 inherit fog 1.

A hidden source still evaluates; a removed source is diagnosed and undo restores it. Empty source output disables consumers; use visibility for an invisible source. Cycles, including stored inactive links, are checked before mutation. There is no separate nonvisual region object or multiple sources per field yet. The geometric density sampler is implemented: see [density](fog-density.md).
