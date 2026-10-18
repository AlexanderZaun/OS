# Lock, Solo and tags

[Русский](<../layer-editor.md>) · [English](<layer-editor.md>) · [Contents](<README.md>)

The selected layer and Object menu expose lock, Solo and color tags. Values belong to the project, persist separately and support undo/redo. They are not panel-local preferences.

Lock prevents setting/name edits, drag, reorder, delete, reset and paste. Selection, copying settings, duplication, visibility, Solo and tags remain available. Duplication does not change the original. Undo/redo remain available.

Multiple layers can be Solo. Only visible Solo layers draw; without any Solo the normal visibility rules apply. Clear Solo is one command. A source hidden from drawing can still provide data to a dependent effect: hiding does not sever the graph.

Tags organize layers without changing pixels. PNG respects Solo/visibility; locking only protects editing. Legacy objects have no optional editor marker until explicitly changed. Core atomically rejects prohibited commands. Checks: layer-editor.test.ts and layer-editor-smoke.mjs.
