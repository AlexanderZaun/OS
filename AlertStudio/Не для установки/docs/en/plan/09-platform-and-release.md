# Block 9. Platform and release

[Русский](<../../plan/09-platform-and-release.md>) · [English](<09-platform-and-release.md>) · [Contents](<../README.md>)

Status in 0.2.0: Storage/Recovery/history/portable work; full reliability/performance/SDK acceptance remains.

This is a requirements/proposal catalog, not a claim of full implementation or the current queue. Follow the [development plan](../development-plan.md). Original numbering is retained; topic pages explain partial progress. Every new area requires deterministic seeks, independent copies, save/open/undo/RU/EN, bounded resources and four-stage checks.

123. Visible history. Action names, state jumps and single-step gestures are implemented; history remains session-only.

124. Draft queue. Serialized draft writes exist; bounded obsolete-snapshot coalescing and last-state latency remain to measure.

125. Revision retention. Count/age/size limits; delete only unreachable trees after validating active/backup indices.

126. Named checkpoints. Snapshots before experiments with comparison and restore as a new version.

127. Project validation. Missing assets/modules, invalid values and clear recovery options.

128. Migrations. Separate schema/effect-behavior/SDK versions and safe older-project handling.

129. Project packaging. Integrity-checked portable project folder/archive with assets/modules, leaving the original unchanged; distinct from application ZIP.

130. Recent projects. Path/thumbnail/time/availability and removal of entries without deleting files.

131. Frame measurements. Mean/slow frames, object counts and effect cost separated from loading/writes.

132. Stress scenes. Many texts, fog layers, thousands of stars and fixed mixed compositions.

133. Adaptive preview. Limit playback resolution/quality and show higher quality when paused.

134. Avoid redundant rendering. Unchanged paused views/cache disposal work; hidden-window optimization remains to evaluate.

135. GPU prototype. Compare identical scenes against Canvas2D using measurements and maintenance complexity.

136. Caches. Bounded texture/mask/font/static-layer storage with usage counters and dependency invalidation.

137. Off-UI work. Investigate workers/offscreen while preserving shared timing and cancellation.

138. Fallback. Clear behavior for unavailable backends, lost contexts and unsupported effects.

149. Backend contracts. Separate neutral simulation/render-specific types and explicit effect capabilities.

150. Module templates. Panel/effect/modifier generators with definitions, tests and separate package builds.

151. Update/rollback. Install versions side by side, validate dependencies and retain exact project locks.

152. Disable extensions. List dependents and preserve unknown project data; safe mode already disables external packages.

153. Registration errors. Complete partial-registration rollback, including asynchronous definition failures.

154. Compatibility diagnostics. SDK/backend/behavior versions and unsupported settings explained to users.

155. Package provenance. Author/version/license/inventory/requested capabilities with explicit external-code trust.

156. Author harness. Preview time/settings/deletion/reinstallation and measure memory/render quality.

170. Visual regressions. Owned baselines with fixed time/seed/dimensions and meaningful tolerance.

171. Editor behavior. Undo/independence/open-save/detached windows/RU-EN/crash recovery.

172. Sustained use. Repeated creation/deletion, hour-long playback and exports with resource-growth measurements.

173. Displays. Compact/Full HD work; HiDPI, OS scaling and monitor removal remain to test.

174. Clean Windows. Portable cross-drive tests pass; separate clean-machine installation/update/removal remain untested.

175. Diagnostic report. Versions/backend/recent errors with private scene data excluded by default.

176. Installer/updates. Portable delivery exists; signed installers, automatic updates/settings preservation/recovery remain separate work.

177. Licenses/materials. Runtime notices are shipped; future encoders/fonts/samples/images still require checks.

178. Built-in help. Existing contextual help/shortcuts/layout reset form the first version; expand with parameter examples.

[Catalog](../feature-catalog.md) · [Requirements](../requirements.md)
