# Multi-file project v1

[Русский](<../project-format.md>) · [English](<project-format.md>) · [Contents](<README.md>)

## Structure

project.json contains id, name, format, revision and scene. A revision lives under revisions/&lt;uuid&gt;/. modules.lock.json pins exact effect and SDK versions. scenes/main/scene.json lists objects; settings/{width,height,background}.json holds individual scene values. Each objects/&lt;id&gt;/object.json stores metadata and settingIds; settings/&lt;key&gt;.json stores one value in a {value} object.

Optional notification values are stored separately. A layer:1 marker enables objects/&lt;id&gt;/layer/settings/{blend,clip,hue,saturation,opacity}.json. An editor:1 marker enables editor/settings/{locked,solo,tag}.json. Missing markers in legacy projects are not added until explicit editing. Incomplete or invalid declared trees are rejected. Unknown effects and values are retained; projects never execute code.

## Writes and recovery

Revisions are immutable. Save writes a new tree, syncs JSON and only then switches the index using rename. project.previous.json points to a validated previous revision, or the first complete tree on initial save. A damaged primary index triggers backup-tree validation, a usedBackup notice and dirty state. Saving into another project ID's folder is rejected.

Windows FolderLease holds a named pipe for the canonical path throughout editing; the OS releases it after a crash. Stale lock files are not automatically deleted. Coordination between computers on a network share is not established.

Drafts live separately in portable Data/Recovery or development userData/Recovery. The debounce is 700 ms; writes are serialized and do not modify the explicit saved project. Restore opens an unsaved copy. Explicit Save and intentional discard deactivate the corresponding draft. Internal portable origins are stored relative to the EXE folder and rebased after relocation.

## Limitations

Process failures and file damage are tested; physical power loss is not. Old revisions are not automatically collected. Assets, keyframe tracks, version migrations and a portable archive of one project are not implemented. See [closing](closing.md) and [moving the application](portable.md).
