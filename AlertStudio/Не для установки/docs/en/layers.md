# Layers panel

[Русский](<../layers.md>) · [English](<layers.md>) · [Contents](<README.md>)

The top row is the foreground. Source dependencies evaluate independently of drawing order and preserve UUID links when reordered.

- Click a name to select; the checkbox changes visibility.
- Rename or F2 on a name opens Dialog: trimmed, nonempty names up to 200 characters, Enter to confirm and Escape to cancel.
- The ⠿ handle moves a layer above/below the target midpoint; a line previews insertion. Drag-scroll works at list edges.
- Up/down/top/bottom commands are keyboard accessible and disabled at boundaries. In filtered lists, insertion is relative to the target in full scene order.
- Search includes names, localized types, type IDs and UUIDs. Filtering does not change visibility, selection or history.

Rename and reorder each create one undo step. Locked protects edits and movement; see [layer state](layer-editor.md) for Solo and color tags. Style and clipping are in [compositing](layer-compositing.md). The list scrolls separately from its header/actions; detached windows use the shared model.
