# Network topology

[Русский](<../network-topology.md>) · [English](<network-topology.md>) · [Contents](<README.md>)

Current nearest chooses neighbors from current positions every frame. Stable links chooses pairs using rest coordinates baseX/baseY, then draws current x/y for those IDs. Both modes work with segments/triangles/chains and support persistence and undo.

Pair selection distance uses rest positions; current length controls visibility, fading over the last 20% of the range. Beyond it a pair stays in the graph and may reappear. Coincident endpoints are not drawn. With clipping, rest positions determine graph membership; a current endpoint outside the region hides its lines.

External sources without rest coordinates fall back to x/y, so stability is not guaranteed. Changing seed/count/distribution/geometry/attachment/distance/neighbors may rebuild the graph; stability concerns animation time. Independent-field wrapping remains unchanged.

Limits are 1000 points/3000 edges; fog masks have a separate budget. Stateless calculation reproduces direct seeks and reopen results. Legacy projects and the example default to current nearest neighbors.
