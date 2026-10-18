# Block 5. Text, shapes and assets

[Русский](<../../plan/05-text-shapes-assets.md>) · [English](<05-text-shapes-assets.md>) · [Contents](<../README.md>)

Status in 0.2.0: Basic text exists; advanced layout and assets remain.

This is a requirements/proposal catalog, not a claim of full implementation or the current queue. Follow the [development plan](../development-plan.md). Original numbering is retained; topic pages explain partial progress. Every new area requires deterministic seeks, independent copies, save/open/undo/RU/EN, bounded resources and four-stage checks.

36. Fonts. Family/style/size, missing-font warnings and controlled replacement on project open.

37. Text layout. Width wrapping, line/letter spacing, alignment and text-block padding.

38. Text appearance. Outline, shadow, gradient and backplate with separately editable, undoable settings.

39. Character animation. Typewriter, stagger, rise, scatter and waves that respect Unicode clusters and spaces.

40. Words/lines. Element delays, ordering, direction and grouping without manually creating many layers.

41. Variables. Name, message, amount, counter and time; local test values precede service integrations.

42. Long content. Line limits, shrink-to-fit, clipping/scrolling and visible policy selection.

43. Title templates. Lower thirds, headings, quotes and event cards with replaceable text and shared style parameters.

44. Basic shapes. Rectangle, ellipse, polygon, star and line with fill, outline and anchor.

45. Corners. Shared radius or independent corners, preserving shape when aspect ratio changes.

46. Gradients. Linear/radial color and opacity stops, Canvas handles and consistent preview/export interpretation.

47. Path editing. Nodes, Bezier handles, closure and simplification in an explicit edit mode.

48. Shape operations. Union, subtraction and intersection while preserving editable originals.

49. SVG import. A documented subset, unsupported-feature report and preserved source asset; never execute embedded scripts.

50. Image import. PNG/JPEG/WebP with dimensions, transparency and thumbnail before insertion.

51. Image placement. Fit/fill/stretch/crop without modifying the source file.

52. Project library. Search/categories, sizes, usage counts and navigation to referencing objects.

53. Asset copying. Controlled inclusion, hash deduplication and missing-link repair.

54. Asset replacement. Keep animation/transforms and explicitly handle changed aspect ratios.

55. Atlases/sequences. Sprite sheets or frame sets, rate/range and missing-frame checks.

56. Resource optimization. Preview limits, memory indicators and unused-image unloading without changing originals.

[Catalog](../feature-catalog.md) · [Requirements](../requirements.md)
