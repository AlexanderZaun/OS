# Artistic controls

[Русский](<../appearance-controls.md>) · [English](<appearance-controls.md>) · [Contents](<README.md>)

| Area | Controls and defaults |
|---|---|
| Fog | Contrast 0–300% (100), stretch 100–300% (100), tilt −180…180° (0) |
| Stars | Glint brightness 0–100% (0), fraction 0–100% (15), speed 0–400% (100), ray length 1–12 (4) |
| Network | Dash 0–100 px (0), gap 0.1–100 (8), speed −200…200 px/s (0), underlay 0–10 px/side (0), color #071223 |

Fog stretch/tilt change textures, not billow centers/velocities or attached stars. With detail 0 contrast does not change a uniform billow. Quality bounds surfaces; this is not volumetric/GPU simulation.

Glints select a stable seeded fraction without rearranging stars. Zero speed fixes glint phase but does not stop movement/ordinary twinkle. Rays are independent of halo radius; overall alpha still applies.

Zero dash gives a solid line; speed sign changes direction. The underlay repeats dash/fade and draws before colored line/glow. Dash phase starts separately per edge rather than flowing through the graph. Controls do not change topology or endpoint geometry. All values persist separately, support RU/EN and undo; legacy defaults retain the previous appearance.
