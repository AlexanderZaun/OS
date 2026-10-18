# Adding objects

[Русский](<../object-creation.md>) · [English](<object-creation.md>) · [Contents](<README.md>)

Each button adds one object without automatically creating its sources. Fog, small/large stars and network receive selected values from modules/presets/cloud-network/layers.json: fog0, small, large and network. Text and external effects use their own creation rules.

Both star variants have type stars but independent settings: 1900 small density-distributed stars or 70 large contour-distributed stars. New stars use cloud mode with an empty source; new networks have an empty star source. Until a source is assigned manually, the object is not drawn and a diagnostic appears. Change field mode for independent stars.

Object links appear first in Properties, including modes controlling source availability. Selecting another object returns the scroll position to the top. Example scene separately creates seven linked objects: four fog layers, two star fields and a network.

Bootstrap passes ObjectTemplate data to Projects. add accepts an optional template ID; without it the first template of that type is used, or effect defaults if none exists. Project-local links are cleared. Values are copied rather than bound to the template; one add is one undo. Opening/saving does not restyle existing objects, incomplete legacy values or definition defaults.
