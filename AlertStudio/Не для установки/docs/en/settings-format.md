# Setting definitions and values

[Русский](<../settings-format.md>) · [English](<settings-format.md>) · [Contents](<README.md>)

Definitions and saved values are separate. Built-in *.setting.json files contain a stable id, type, default, label.ru/en and optional min/max/step/unit/animatable/group. Select defines options with a value and bilingual labels. Value is currently limited to primitives. A saved settings/&lt;id&gt;.json contains {value}.

Ajv validates projects, commands and external definitions; additional checks reject duplicate IDs, invalid defaults, ranges, steps, colors and unknown select values. Defaults are copied at creation. Unknown values are retained; updating definitions must not silently restyle an old project.

type:source stores a UUID or empty string; sourceType names the effect type. Core checks existence, type, self-links and cycles on assignment. Removing a source leaves a dangling link for diagnostics and undo.

when is {key,equals,and?:[{key,equals},...]}. The additional array is flat and has 1–8 conditions; referenced keys are validated. A field is shown only when all conditions match. Missing values use defaults; hiding controls does not delete saved settings.

Migrations, compound values and keyframe tracks are not implemented. See [object creation](object-creation.md) for templates and [property tools](settings-tools.md) for search/reset.
