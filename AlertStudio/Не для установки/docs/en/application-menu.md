# Application menu

[Русский](<../application-menu.md>) · [English](<application-menu.md>) · [Contents](<README.md>)

| Menu | Available commands |
|---|---|
| File | New, example scene, open, save, save as, PNG, recovery |
| Edit | Undo/redo, action history, extensions, language |
| Scene | Scene information and fit; resizing an existing scene is not implemented |
| Object | Catalog, name/duplicate/visibility/order/delete, lock/Solo/tags, copy/paste |
| Playback | Play/pause, start, loop, speed |
| View | Fit scene/selection, 100%, zoom, center, hand |
| Window | Show/restore a panel, add a view, open a detached window, reset layout |
| Help | Shortcuts and version information |

Panel management lives in Window; the optional Panels panel offers quick +/↗ actions. Show uses an existing view. A detached window is another view of the shared model, not a transferred instance with its local state.

F10 focuses menus; arrows/Home/End move focus, Enter invokes an action and Escape closes the list. Lists stay within the viewport and scroll. Dialog traps focus and blocks menus. Ctrl+N/O/S/Shift+S and Ctrl+Z/Shift+Z use shared operations; text undo in inputs remains local.

View commands target the active/last Canvas; if all are closed, a view is created. See [navigation](canvas-navigation.md), [stages](notification-workspaces.md) and [layers](layers.md).
