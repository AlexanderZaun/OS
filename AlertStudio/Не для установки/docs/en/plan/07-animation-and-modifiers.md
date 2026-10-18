# Block 7. Animation and modifiers

[Русский](<../../plan/07-animation-and-modifiers.md>) · [English](<07-animation-and-modifiers.md>) · [Contents](<../README.md>)

Status in 0.2.0: Shared clock and four basic workspaces exist; keys/modifiers/montage do not.

This is a requirements/proposal catalog, not a claim of full implementation or the current queue. Follow the [development plan](../development-plan.md). Original numbering is retained; topic pages explain partial progress. Every new area requires deterministic seeks, independent copies, save/open/undo/RU/EN, bounded resources and four-stage checks.

65. Transforms. Position, scale, rotation, anchor and reflection with shared object rules.

66. Pulse. Opacity, size or brightness waveforms with frequency, phase and depth.

67. Sway/jitter. Bounded movement/rotation and smooth seeded noise without altering base geometry.

68. Blur/shadow/glow. Universal controls with visible cost and backend capability validation.

69. Color correction. Brightness, contrast, saturation and hue with explicit post-effect order; shared layer hue/saturation already exist.

70. Crop/mask. Rectangle, shape or linked object with source-deletion handling and cycle prevention; previous-layer clip already exists.

71. Repeater. Linear/circular procedural copies with transform increments, without cluttering the layer list.

72. Modifier stack. Reorder, disable, copy and reset entries with specific history labels.

89. Shared clocks. All Canvas views share play/pause/time; divergent panel animation is prevented.

90. Timeline. Duration, project FPS, preview range, cursor and frame stepping.

91. Keyframes. Add/move/copy/delete with animatability supplied by setting metadata.

92. Interpolation. Linear, stepped and smooth curves; numeric and color values use appropriate rules.

93. Curve editor. Zoom, multi-key selection, tangents and precise numeric editing.

94. Markers. Named points, comments and list navigation without implicitly changing duration.

95. Working range. Preview in/out, looping and selected export, addressable in frames/time.

96. Time offsets. Layer delay, speed, reverse and repeat with defined ordering against keys/modifiers.

97. Intro/hold/outro blocks. Basic shared stages/durations/fades exist; independent block contents and advanced animation remain.

98. Transitions. Dissolve, slide, scale and mask reveal with editable parameters after application.

99. Cascades. Object/character/particle start offsets with fixed or seeded random order.

100. Visual events. Flash, particle burst and text appearance, initially triggered locally in the editor.

101. Template states. Waiting, showing and ending with clear restart rules.

102. Reusable blocks. Save animation fragments with target remapping and parameter compatibility checks.

103. Scene list. Thumbnails, rename/duplicate and independent dimensions/backgrounds where project format permits.

104. Clip sequence. Timeline scenes, ordering, trimming and gaps.

105. Scene transitions. Overlap, dissolve, masks and slides with durations checked against both clips.

106. Aspect ratios. 16:9, 9:16, 1:1 and arbitrary sizes with explicit composition adaptation.

107. Nested scenes. Reuse fragments with local overrides.

108. Batch variants. Multiple texts/palettes for one template, previewed before export queues.

[Catalog](../feature-catalog.md) · [Requirements](../requirements.md)
