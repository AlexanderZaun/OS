# Аудит неизменного референса

Источник: C:/Life/OS/smoke-configured.html, 4522 строки, 225055 байт. Неизменная копия: reference/original/smoke-configured.html. SHA256: F542F3BCACDB5F6C6B07E0BB6511E79B295F458BD26D091CEF8757674DEB4FD0. Референс запускается только для сравнения, приложение его не встраивает.

Конфигурация: version 2, seed 8197, duration 48 s, scene 1920×1080, cloud 900×480, центр 50/50%, clearCenter .42. Config отличается от factory: фон solid вместо transparent, lines.support false вместо true и иные contrast-параметры. Каждый исходный fog имеет свои speed/pattern/brightness/color/motionStyle, но фиксированные ID fog1–fog4. В новой модели должны быть произвольные UUID, отдельные значения и явные source links.

| Возможность | Участок референса (строки / функции) | Целевой модуль | Статус | Способ проверки |
|---|---|---|---|---|
| Config/factory/user presets | 211–692, embedded/factory | importer + presets | Аудит; перенос запланирован | Извлечь оба JSON, проверить отчёт неподдерживаемых полей |
| Размер сцены, raster/view scale | 846–1057, sceneRasterScale/applyCanvasSize | core scene + Canvas/view | Только независимый scene size и fit нового редактора | UI create, CSS scale; resize policies ещё нет |
| Cloud геометрия | 1173–1228, perimeter/shapeRadius/transform | fog simulation + backend mask | Не перенесено | Сравнить cloud/oval/pill/diamond/wisp |
| Маска мягкого края | 1195–1228, destination-in + blur | Canvas fog renderer | Не перенесено | Сравнить alpha на границе |
| Seeded текстура | 1230–1258, 4 noise grids 4/8/16/32 | fog renderer texture cache | Не перенесено | Тот же seed/color/softness, alpha diff |
| Fog patches и 10 движений | 1260–1341, rebuild/fogPosition | fog state/simulation | Не перенесено | Несколько UUID, воспроизводимое время |
| Варианты тумана | 1343–1472, variationOffset/fogWarp/warpedTexture | fog simulation/Canvas | Не перенесено | Standard bypass, ribbons/rolling/rising/eddies/waves |
| Density 0/25/100 и clear center | 1474–1518, densityFill/drawFog | fog renderer | Не перенесено | 25 сохраняет legacy, 100 overrides brightness/opacity |
| Малые/крупные звёзды | 1520, 2164–2219, starPosition/randomDrift | stars simulation | Не перенесено | Clusters/uniformity, centerCount, magnetic sources |
| Формы/свет/halo/shadow/trails | 2118–2139, 2220–2318 | stars Canvas renderer | Не перенесено | Exact twinkle subset, stamp cache, пять форм |
| Flying particles | 2078–2087, 2154–2162 | flying simulation/renderer | Не перенесено | Lifetime/fade, scatter at crossing |
| Flow stars по туману | 2089–2116, 2142–2152 | flow + typed fog links | Не перенесено | Geometry/warp совпадают, inactive source diagnostics |
| Lines/network | 2320–2385 | lines renderer + source links | Не перенесено | Дистанция, triangles/diamonds/chains/web, dash/support |
| Плотностной контур | 1533–1763, marching squares/edge cache | edge density renderer | Не перенесено | Threshold, traceQuality, traceRate, contour alignment |
| Нити/хвосты/искры | 1765–2000, velocity field/buildEdgeStrands | strands effect | Не перенесено | History replay, density fade, braid/tail lag |
| Scatter crossing boundary | 2001–2076 | fixed-step simulation + checkpoint | Не перенесено | Hysteresis .006, persistent impulse, reset/seek |
| Text wrapping/backing/outline | 2402–2499, 2605–2637 | text renderer/settings | Новый базовый текст; не паритет | Кириллица/перенос проверены; полный textLayout впереди |
| Dark Base | 2511–2603 | backing effect | Не перенесено | Cloud/text/custom, falloff, follow source movement |
| Compositing/order/alpha | 2639–2790 | render coordinator | Новый text/rect source-over только | Canvas alpha checked; blend/mask parity не пройден |
| Playback/restart/time | 2792–2849 | core animation/runtime | Аналитический Orbit preview; не reference parity | Фиксированное время; общие этапы не реализованы |
| Definitions/control dependencies | 2850–3471 | settings SDK/properties | Раздельные определения и generic properties реализованы | Добавить radius без правки Properties |
| История/layer workflow | 3081–3103, 3475–3755 | commands/history/panels | Общая история нового редактора; не весь workflow | UI main+detached; drag grouping/reorder впереди |
| Validation/import/presets | 3757–3890, 4273–4350 | import/migrations/presets | Не перенесено | Legacy neutral defaults, неизвестные поля без потерь |
| PNG/HTML export + draft | 1071–1154, 3853–3861, 4018–4057 | storage/export adapters | Новый folder Save; PNG/HTML не перенесены | Folder roundtrip выполнен; export не заявлен |

## Визуальные эталоны

`node tests/reference-capture.mjs` запускает оригинал в Windows Electron 44.8.0. При t=0 resetScatter/render, затем для каждого кадра replay 1/60 s до t=6 и t=12. Это важно: scatter зависит от истории, edge cache хранит предыдущие contours/density. Базовые пути периодичны, весь stateful результат не гарантирован бесшовным.

Кадры `reference/baselines/t0.png`, t6.png, t12.png — RGBA Canvas 1920×1080; фон изображения не запечён, backgroundInOutput false. `conditions.json` содержит полные исходные значения, backend, seed и время. Кадр t6 просмотрен визуально. Автоматическое сравнение перенесённого тумана ещё отсутствует. Будущий visual diff должен иметь tolerances и одинаковый replay, а не требовать побайтового равенства между GPU.
