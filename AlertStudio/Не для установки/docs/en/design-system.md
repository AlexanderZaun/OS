# Design system

[Русский](<../design-system.md>) · [English](<design-system.md>) · [Contents](<README.md>)

ui-kit/theme.css is the single source of palette and shared controls. Use --studio-bg, --studio-surface, --studio-raised, --studio-sunken, --studio-border, --studio-text, --studio-muted, --studio-accent, --studio-danger and --studio-success. Do not add a separate palette, global resets or selectors targeting other panels.

Inherit the host font. Standard controls use shared spacing, focus/hover/disabled states and a 6 px radius. Errors and dirty indicators must be understandable without color. Long labels retain full aria-label/title text; truncation must not change accessible names.

All in-app dialogs use ui-kit/Dialog.tsx: a body portal, focus trap, Escape, focus restoration, scrolling and closeDisabled during writes. The application close prompt also uses the shared theme; native file pickers remain system dialogs. F10 must not escape a modal.

SettingHeading associates labels, units, changed markers and reset. Links appear first; search can expose hidden fields with condition explanations. Reset and paste are disabled for locked recipients. Deferred inputs commit on Enter/blur and cancel on Escape where applicable.

Dockview variables are mapped in the workspace adapter; menus use a portal and viewport constraints. The catalog is a regular panel; history initially opens as a tab beside Properties. Current dimensions are listed in [compact layout](compact-layout.md), superseding old checkpoint values.

For UI changes inspect 900×650 and 1920×1080, narrow panels, Dialog and long RU/EN labels. OS DPI, screen readers and a complete accessibility audit remain untested.
