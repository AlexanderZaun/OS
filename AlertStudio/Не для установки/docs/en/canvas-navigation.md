# Canvas navigation

[Русский](<../canvas-navigation.md>) · [English](<canvas-navigation.md>) · [Contents](<README.md>)

| Control | Result |
|---|---|
| Wheel | Zoom toward the cursor, only over Canvas |
| −/+ and presets | Center-based zoom; range 1–800% |
| Percentage input | Exact number, dot/comma and % suffix; Enter/blur commits, Escape cancels |
| Fit / Home | Whole scene, automatically updated on panel resize |
| F | Fit selection with rotation and 24 CSS px padding |
| 1 | 100%: one scene pixel per CSS pixel |
| Center | Center the scene without changing zoom |
| Middle button / Space+drag | Pan |
| H / Hand | Persistent left-button pan |
| Arrows / Shift+arrows | Pan by 40/160 CSS px |
| Shift+wheel | Horizontal pan |

Shortcuts require Canvas focus and do not steal text input. Escape cancels pan. One touch contact pans, two perform pinch/pan; CDP pointer events were tested, not a physical screen.

Each Canvas has its own camera and tool. Navigation does not change Project, dirty, undo, bitmap or playback. Cameras reset on project changes and are not persisted across launches. Fit selection requires a visible object with editor bounds; glow beyond geometric bounds is not measured. At the 1% limit a huge object may not fit.
