# Block 4. Particles and lines

[Русский](<../../plan/04-particles-and-lines.md>) · [English](<04-particles-and-lines.md>) · [Contents](<../README.md>)

Status in 0.2.0: Network partially implemented; universal emitters/contours absent.

This is a requirements/proposal catalog, not a claim of full implementation or the current queue. Follow the [development plan](../development-plan.md). Original numbering is retained; topic pages explain partial progress. Every new area requires deterministic seeks, independent copies, save/open/undo/RU/EN, bounded resources and four-stage checks.

21. Emitters. Point, line, rectangle, ellipse and contour with a visible emission region and resize handles.

22. Particle lifecycle. Rate, bursts, lifetime, prefill and an explicit maximum active count.

23. Initial movement. Speed, direction spread, cones and rotation with separately seeded ranges.

24. Forces. Gravity, wind, drag, vortices and attraction with defined order and stable seeking.

25. Appearance over age. Size, color, opacity and rotation from birth to death using curves/gradients.

26. Shapes and sprites. Circles, squares, sparks and imported images; assets travel with projects.

27. Trails. Ribbons with length/width/fade, bounded history and correct restoration after seeking.

28. Ready systems. Dust, snow, rain, confetti, bubbles, leaves and ash reuse shared particles where appropriate.

29. Scene borders. Thickness, insets, rounding, color and dashes; follow scene dimensions or use explicit size.

30. Running light. A bright contour segment with tail length/speed/direction and seamless corner traversal.

31. Contour drawing. Draw/erase, pauses and multiple segments with independent visible start/end.

32. Wavy lines. Amplitude, frequency, phase speed and damping; endpoints may link to objects.

33. Orbits/arcs. Elliptical paths, gaps, moving markers and independently controlled rings.

34. Connecting lines. Straight, segmented and curved object links that update on move/delete.

35. Neon contours. Separate core/glow, irregular brightness and flashes while preserving thin-line readability.

[Catalog](../feature-catalog.md) · [Requirements](../requirements.md)
