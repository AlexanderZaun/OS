# Block 6. Editor and panels

[Русский](<../../plan/06-editor-and-workspaces.md>) · [English](<06-editor-and-workspaces.md>) · [Contents](<../README.md>)

Status in 0.2.0: Panels, layers, drag/camera, lock/Solo/tags and property tools work; geometry remains.

This is a requirements/proposal catalog, not a claim of full implementation or the current queue. Follow the [development plan](../development-plan.md). Original numbering is retained; topic pages explain partial progress. Every new area requires deterministic seeks, independent copies, save/open/undo/RU/EN, bounded resources and four-stage checks.

73. Rename. Shared dialog/F2, selected name, nonempty 200-character limit, undo/redo and persistence are implemented.

74. Layer order. Up/down/top/bottom and handle drag with insertion marker and stale-revision protection; cross-window transfers remain planned.

75. Groups. Nested transforms, collapse and group selection; ungrouping preserves appearance.

76. Lock/isolation. Lock and multi-Solo are implemented; retain access to allowed selection/visibility actions.

77. Multiple selection. List ranges, marquee and batch editing of compatible properties.

78. Cross-scene copy. Objects with dependencies/assets and explicit module-version conflict handling.

79. Layer search. Name, localized type, type ID and UUID/type filtering exist; richer tag/visibility/lock filters remain.

80. Precompositions. Nested scenes with duration/overrides and recursion prevention.

81. Canvas selection. Rotated bounds/text measurement and selection overlay exist; pixel hit testing and cycling overlaps remain.

82. Move/resize. Mouse movement, one undo, Escape and revision protection exist; resize/rotation handles, constraints and snapping remain.

83. Zoom/pan. Cursor zoom, 1–800% input, Space/middle/Hand, arrows, Shift-wheel, fit/center and CDP pinch work; persisted cameras/physical touch tests remain.

84. Grid/guides. Cell spacing, rulers, custom guide lines and workspace persistence.

85. Snapping. Centers, scene edges, objects and guides, with temporary keyboard disable.

86. Alignment/spacing. Edges/centers, equal gaps and distribution against scene/group.

87. Preview backgrounds. Checkerboard exists; broader light/dark/custom checks must stay outside transparent export.

88. Safe areas. Title margins, centers and crop regions for vertical/square formats.

115. Shared property editor. Numeric/color/enum controls exist; angle/vector/gradient extensions must share spacing/focus rules.

116. Reset/changed values. Default-difference markers, per-field/full reset and units are implemented; broader compound editors remain future work.

117. Workspaces. Saved panel layout/reset exist; named composition/animation/export layout sets remain.

118. Pinned properties. Follow selection or pin a target with the mode visible in the header.

119. Detached windows. Additional shared-model windows exist; true instance transfer/geometry restoration/monitor recovery remain.

120. Command palette. Search commands/objects/panels with shortcuts and active-mode context.

121. Shortcut configuration. Conflict search and default profiles without stealing input-field commands.

122. Accessibility. Keyboard operation, OS scaling, contrast, large text/reduced motion and RU/EN audits.

[Catalog](../feature-catalog.md) · [Requirements](../requirements.md)
