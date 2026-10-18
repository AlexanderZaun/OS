# Closing and unsaved changes

[Русский](<../closing.md>) · [English](<closing.md>) · [Contents](<README.md>)

Closing the main window ends the application and all panels; closing an additional window closes only that window. A dirty project opens the shared Dialog:

| Action | Result |
|---|---|
| Save and close | Wait for Save and current draft deactivation, then exit |
| Close without saving | Leave the explicit project unchanged; finish in-flight draft writes, deactivate the current draft and exit |
| Cancel / Escape | Keep windows, edits and draft; Enter defaults to cancel too |

In portable mode the first Save automatically uses Data/Projects; a new development project needs a folder picker. Picker cancellation or write failure keeps the app open for retry. Buttons/Escape are disabled while completion is in progress. Clean projects do not need confirmation.

A request during open/save/picker waits for that operation. One window owns confirmation; main validates owner, request ID and phase. Other windows block edits. Discard failure preserves the lease and edits; other recovery candidates are not deactivated. Old revision files are not deleted.

A crash/app.exit bypasses this Dialog; the newest unwritten edits may be absent from Recovery. There is no native fallback for a broken renderer or Close with draft action yet. Checks: close.test.ts, close-smoke.mjs and recovery-smoke.mjs.
