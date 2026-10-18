# Linked scene: fog → stars → network

[Русский](<../linked-scene.md>) · [English](<linked-scene.md>) · [Contents](<README.md>)

File → Example scene creates a new unsaved 1920×1080 composition: four fog layers, 1900 small/70 large stars and a network of large stars. The region is 900×480; UUIDs are regenerated. Replacing a dirty project requires confirmation. Three fog layers inherit the first region; stars reference fog and network references large stars.

For manual assembly add fog, then stars with a fog source, then network with a star source. One button does not create dependencies. Hiding a source using visibility preserves evaluation; zero output produces inactive diagnostics. A removed source leaves a link for undo. Self/cycle/wrong-type assignments are rejected.

Core evaluates each source once per frame independently of z-order. All Canvas views share Playback clocks but have independent cameras. Dragging linked fields edits offsets rather than source coordinates. Project format 1 and effect versions 0.1.0 remain unchanged.

Network supports segments/triangles/chains, current/stable neighbors, distance/neighbor count, glow, dash/underlay and density masking. Limits are 1000 points and 3000 edges; mask budgets are documented separately. Ordinary twinkling does not change pairs.

Multiple weighted fog sources, flying/flow, Dark Base and Edge Light are not implemented. Pixel parity with the HTML is not required. See [regions](shared-fog-region.md), [density](fog-density.md), [mask](line-mask.md) and [topology](network-topology.md).
