# Block 3. Atmosphere and magic

[Русский](<../../plan/03-atmosphere-and-magic.md>) · [English](<03-atmosphere-and-magic.md>) · [Contents](<../README.md>)

Status in 0.2.0: Artistic catalog, not implemented.

This is a requirements/proposal catalog, not a claim of full implementation or the current queue. Follow the [development plan](../development-plan.md). Original numbering is retained; topic pages explain partial progress. Every new area requires deterministic seeks, independent copies, save/open/undo/RU/EN, bounded resources and four-stage checks.

57. Light rays. Source, spread angle, length, softness and pulse with visible selection bounds.

58. Bokeh. Seeded blurred lights, size range, depth and slow movement within a region.

59. Rain/snow. Direction, speed, size, density and depth as specialized particle configurations.

60. Aurora. Colored ribbons/folds with smooth motion, researched for rendering quality and cost.

61. Fire/plasma. Source contours, palette, rise speed and tongues; establish convincing output before expanding controls.

62. Water/ripples. Ring sources, damping and reflected glints; full refraction needs a separate GPU pass.

63. Noise/grain. Scale, strength, chroma and temporal change with identical export seeds.

64. Digital effects. Scanlines, short glitches, RGB offsets and pixelation with explicit region/intensity.

195. Smoke jet. Point/line/contour sources with direction/expansion/speed/billow lifetime/turbulence; visible source flow beyond bounded fog.

196. Steam/breath. Soft short bursts with rapid expansion/dissolve, source size/tint/delay/duration.

197. Ink in water. Color-cloud spread and branches with palette/speed/fold scale/openings; artistic imitation before physical research.

198. Distant clouds/haze. Large drifting density/parallax layers with height/billow size/light color, extending fog rather than copying it.

199. Sandstorm. Fine particles/dust veil with direction/gusts/visibility/color/depth and separate coarse-particle control.

200. Blizzard. Snow depth planes, gusts/swirl, density/size variation/speed/wind as a ready scene system.

201. Wet/fogged glass. Droplets/slow runs/cloudiness with size/count/drain speed/clear areas; background refraction later.

202. Heat shimmer. Rising waves above heat with region/amplitude/frequency; requires background sampling and another render pass.

203. Magic portal. Rotating ring/strands/sparks/haze with diameter/width/speed/palette/opening, composed from compatible effects.

204. Object aura. Pulsing silhouette halo/haze/sparks with width/intensity/speed; requires text/shape/image mask.

205. Nebula. Colored clouds, large structure, dark voids and slow movement; stars remain independently editable layers.

206. Comet/meteor trail. Bright core, elongated tail/particles with path/speed/length/color and manual trajectory support.

207. Energy wave. Expanding ring/light front with speed/width/fade/shape; distortion follows the basic transparent version.

208. Light ribbons. Interwoven gradients/glow with count/width/bend/phase speed/trails for backgrounds/borders/transitions.

209. Magic runes. Customizable symbols on circles/paths with spacing/rotation/order/pulse.

210. Stardust. Gathering/scattering/path-following luminous particles with spread/density/attraction/tints, using shared systems.

211. Flame contour. Fire along text/shapes with tongue height/palette/speed/direction and optional visible source object.

212. Embers. Slow irregular red/orange particles with size/flash rate/rise speed/trails as a particle preset.

213. Burn/ash. Noise-front disappearance with hot edge/particles, direction/seed/speed/edge width; requires mask/emitter.

214. Cracks. Progressive branching from impact points with branch count/width/growth speed without modifying the source image.

215. Shards. Mask/image fragments with size/impulse/gravity/rotation/fade and reproducible trajectories.

216. Dust dissolve. Directional object disappearance into color-sampled particles with duration/density/size and source-point sampling.

217. Liquid blobs. Merging/splitting droplets with count/apparent viscosity/speed/palette; start with 2D metaballs, not full hydrodynamics.

218. Bioluminescent network. Growing luminous strands/nodes with impulses/decay, branching/density/width/pulse rate for organic/science-fiction looks.

[Catalog](../feature-catalog.md) · [Requirements](../requirements.md)
