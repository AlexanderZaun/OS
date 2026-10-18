# Settings search and reset

[Русский](<../settings-tools.md>) · [English](<settings-tools.md>) · [Contents](<README.md>)

⌕ in Properties opens search, the Changed filter and reset/copy/paste. Closing it clears search/filter. Sources stay first; these tools are view-local and reset when another object is selected.

Search covers RU/EN labels, IDs, groups and options regardless of UI language; case and Russian е/ё are normalized. All query words must match metadata. Units, notification text and source names are not indexed. Escape clears the query. Search/filter also find hidden fields: they appear disabled with Available when… and the controlling conditions beside them, including AND.

The marker and count mean differences from defaults of the installed effect version, not from the saved project. Example templates may therefore start with differences. Missing values that use defaults do not count as changed.

↶ resets one field. The shared Dialog independently resets all known effect values (including hidden fields, coordinates and sources) or layer appearance. Filters do not limit full reset. Unknown keys, name/visibility/lock/Solo/tag are retained. Each reset is one undo; no-ops add no step.

Lock blocks reset, not search. An unavailable/mismatched module cannot be reset using another version's defaults. Core atomically validates keys, scope and revision. The dialog closes on revision/selection/operation changes; cancel changes nothing. See [copy/history](copy-history.md).
