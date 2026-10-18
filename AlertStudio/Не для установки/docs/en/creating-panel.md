# Creating a panel

[Русский](<../creating-panel.md>) · [English](<creating-panel.md>) · [Contents](<README.md>)

The working example is examples/project-info. A package exports register(host), receives React from the host and registers a panel ID with ru/en labels. The component reads snapshots and dispatches commands; it must not hold the authoritative project copy.

Use shared theme tokens and the host font, inheriting panel-body. interactionPending must disable editable fields during structural operations. workspace is optional: do not assume it exists in a detached window. Raw Electron/Dockview/IPC are not exposed.

Build the package separately, install through Extensions and restart. Check multiple instances, the shared project/undo, closing and subscription disposal, RU/EN, a narrow panel and a detached window. Use the shared Dialog for dialogs. See [SDK](module-sdk.md) and [style](design-system.md).
