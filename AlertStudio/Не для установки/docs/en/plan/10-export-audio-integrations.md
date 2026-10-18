# Block 10. Export, audio and integrations

[Русский](<../../plan/10-export-audio-integrations.md>) · [English](<10-export-audio-integrations.md>) · [Contents](<../README.md>)

Status in 0.2.0: Current-frame PNG works; video/audio/integrations are absent and audio is deferred.

This is a requirements/proposal catalog, not a claim of full implementation or the current queue. Follow the [development plan](../development-plan.md). Original numbering is retained; topic pages explain partial progress. Every new area requires deterministic seeks, independent copies, save/open/undo/RU/EN, bounded resources and four-stage checks.

139. Single-frame PNG. Current scene-resolution transparent PNG works; independent export-size controls remain planned.

140. PNG sequences. Frame ranges, names, FPS and restart for external editing/quality checks.

141. Alpha WebM. Verify codec/transparency/playback in target applications; the extension alone proves nothing.

142. Opaque video. Validate encoders/licenses and explicitly set background/FPS/resolution/quality/duration.

143. GIF. Palette/dithering/dimensions/rate and explicit transparency limitations in format UI.

144. Export queue. Multiple jobs, frame progress, measured remaining-time estimates and retries.

145. Cancellation. Stop render/encoder, release memory and remove only this job's temporary files.

146. Job isolation. Current PNG captures a fixed snapshot; future multi-frame jobs must remain unaffected by later edits.

147. Export host resources. Exact effect versions/fonts/assets, bounded frame queues and controlled memory.

148. Output checks. Frame count/duration/first-last frames/transparent edges/no gaps and preview comparison.

157. Audio import. Choose decoder/formats, report duration/sample rate and copy source assets into projects.

158. Audio tracks. Position/trim/volume/mute/Solo and multiple clips on shared visual clocks.

159. Waveform. Zoom, thumbnail caches and precise playhead without repeated full-file decoding.

160. Audio fades. Volume curves and crossfades without clicks.

161. Synchronization. Output latency, seeking/start and long-scene drift checks.

162. Audio-reactive effects. Map amplitude/bands to selected parameters with analysis fixed for deterministic export.

163. Export with audio. Mix/synchronize only after visual export host readiness; verify codecs and duration.

164. Clean output window. Composition without editor UI; test transparency/capture in the actual target application.

165. Test events. Local name/message/amount controls for template checks without service connections.

166. Local control API. Bounded validated commands, explicitly enabled by users.

167. Event queue. Repeats/priorities/length bounds and animation interruption rules.

168. Integrations. Add specific services only as separate tasks after defining events/authentication.

169. Operator mode. Large scene-launch controls, queue status and protection from accidental editing.

[Catalog](../feature-catalog.md) · [Requirements](../requirements.md)
