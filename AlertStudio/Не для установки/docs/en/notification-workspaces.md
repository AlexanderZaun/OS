# Four notification workspaces

[Русский](<../notification-workspaces.md>) · [English](<notification-workspaces.md>) · [Contents](<README.md>)

Main effect, Intro, Outro and Assembly are views of one composition. Objects and links are shared. Per-stage object values, keyframes, object delays and montage are not implemented.

Default intro/main/outro durations are 1/5/1 s. Intro/outro range: 0.1–60 s; main hold: 0.1–3600 s; step 0.1. Enter/blur commits, Escape cancels and invalid input is not saved. Fade is linear group opacity; disabling it keeps the composition visible until the stage boundary.

Assembly uses [0,1) intro, [1,6) main and [6,7) outro; from 7 the final frame is transparent. effectTime is continuous. Isolated intro starts at 0, outro at intro+main; main effect is an independent preview from 0 with its own period.

Changing workspace stops playback, resets time and disables repeat; repeat can be enabled again. Clicking the current workspace does not reset time. Finite stages stop at the end; Play from the end restarts at zero. Open/New/Recovery/example return to main. Navigation/seeking do not change Project; durations/fades are undoable autosaved edits.

Group opacity applies once to the combined image. UI/checkerboard neither fade nor export. PNG already supports the selected stage and transparency; WebM is absent.

Project.notification is optional (version 1), with separate defaults. Explicit editing adds notification:1 and separate notification/settings/&lt;key&gt;.json values within the revision. Legacy structure is preserved; damage requires validated fallback. Workspace/clocks are shared across windows but not stored in Project.
