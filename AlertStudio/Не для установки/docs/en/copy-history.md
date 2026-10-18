# Settings copy and history

[Русский](<../copy-history.md>) · [English](<copy-history.md>) · [Contents](<README.md>)

Object → Copy settings stores an immutable snapshot of known settings and appearance in an internal clipboard shared by windows. It is not the Windows clipboard. Copying a locked layer is allowed and does not change dirty, autosave or undo.

Paste settings… offers scopes. Effect settings require matching type and exact version; known hidden values are included and unknown recipient keys retained. Coordinates, sources and controlling modes are excluded by default and enabled separately. An invalid link rejects the entire paste. Appearance can cross types; absent donor style means normal defaults. Name, UUID, visibility, lock, Solo and tag are not copied.

Paste validates lock and revision and is atomic with one undo. No-op/cancel adds no step. The dialog closes when the target state changes. Open/New/Recovery clear the clipboard; cross-session/project transfer is not implemented.

Edit → Action history opens a panel initially tabbed beside Properties. It supports movement, additional views and detached windows. At most 100 steps are retained, newest first. A row restores the state after its action; start means the earliest still-available state. Back/forward jumps publish one snapshot rather than replaying recorded commands.

A new edit after undo drops the redo branch. Selection, camera, search, copying, playback and export add no steps; stage settings do. Save retains in-memory history but never writes it to disk. Open/New/Recovery start fresh. Git backup tags and file revisions are separate mechanisms.
