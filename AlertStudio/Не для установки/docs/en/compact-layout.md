# Compact layout

[Русский](<../compact-layout.md>) · [English](<compact-layout.md>) · [Contents](<README.md>)

Current dimensions: combined header 36 px, stage bar 39 px, wide Canvas toolbar 37 px, Canvas bottom row 25 px, footer 23 px and Dockview tabs 28 px. Groups wrap in narrow panels; short panels scroll tools to preserve image space.

Catalog: initial width 170 px, minimum 120 px. Layers and Properties: minimum 160 px. Updated constraints apply to restored layouts without resetting placement or cameras. Long names truncate with complete titles/accessible names; the + symbol never wraps.

Repeated explanations are replaced by ? and the shared Dialog. Dialog renders through a body portal, escapes panel clipping and preserves modal focus on F10. Layer actions may scroll horizontally; the whole document must not overflow horizontally.

compact-layout-smoke.mjs checks 900×650, 1920×1080 and 2560×1440, minimum splitter widths, bars, help, RU/EN and unchanged Snapshot. Measured Canvas viewport heights were 388/851/1211 px respectively. Other DPI settings and physical touch devices are not separately tested. See the [design system](design-system.md).
