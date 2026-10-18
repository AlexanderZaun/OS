# Density-based star placement

[Русский](<../fog-density.md>) · [English](<fog-density.md>) · [Contents](<README.md>)

Cloud stars choose contour (legacy default) or density. Density bias 0–100% (default 60) concentrates stars in billows; zero still prefers dense regions. Density fade 0–100% (default 100) attenuates stars outside the envelope, at edges and in openings. Zero disables fading. New example small stars use density; large stars use contour.

core/geometry/density.ts samples the geometric billow envelope: centers/radii/weights, stretch/tilt, contour/softness and opening. This is not the noisy texture's exact alpha: detail/contrast/RGB/brightness/global opacity are excluded.

densityPlacement builds a 48×48 rest map and cumulative probability using existing seeded samples; its cache holds at most 16 maps. Seeking does not rearrange rest positions. Seed/geometry/weight changes intentionally rebuild the map. Attachment adds billow movement; current density independently controls alpha with field transforms accounted for.

centerCount uses a central map of radius 0.42. It counts elements, not guaranteed visible points. Boundary cells may place a point outside, which then fades. densityAlpha is separate from twinkle; network takes the minimum at endpoints and can additionally mask edge interiors. See [line masking](line-mask.md).
