# Реально выполненные проверки — 16.10.2026

Среда: Windows (win32), Node 24.19.0, pnpm 11.25.0, Electron 44.8.0, React 19.3.1, Dockview 8.5.1, Vite 8.3.4, TypeScript 5.9.3. Типы и filesystem/GUI тесты выполнялись разрешённым запуском вне managed sandbox: внутри sandbox pnpm junction declaration lookup и TEMP rename/realpath дали ошибки доступа. Эти ошибки не выдаются за ошибки продукта или успешные sandbox-проверки.

| Команда | Результат |
|---|---|
| node node_modules/typescript/bin/tsc --noEmit | exit 0 |
| node tools/check-boundaries.mjs | 8 независимых файлов, проверка пройдена |
| node tools/test.mjs | 9 поведенческих тестов, 9 passed |
| node tools/build.mjs | desktop/UI и 2 отдельные пакета собраны |
| node tests/electron-smoke.mjs | Windows Electron UI smoke пройден |
| node tests/recovery-smoke.mjs | recovery, process locking, normal close и theme UI smoke пройдены |
| node tests/reference-capture.mjs | оригинал запущен, t=0/6/12 сохранены |
| node tools/performance.mjs | 1/50/200 объектов, результаты сохранены |

Logic tests: независимость defaults/duplicate, undo/redo, чистая evaluate, отклонение команды с лишними полями, многофайловый roundtrip, сохранение неизвестного эффекта/значения, сбой на третьем value и повторное открытие старой ревизии, несовместимый SDK/дубли ID/отсутствующие и циклические dependencies, inert staging, install и hash/path rejection.

UI test запускает **собранный** Electron без Vite server. Через настоящие кнопки создаёт проект, добавляет два текста, изменяет их, открывает отдельное окно Properties, меняет текст там и отменяет из главного окна. Сохраняет/открывает папку. Диалоги выбора папки подменены тестом на фиксированные пути; установка, файловые операции, protocol, dynamic import, lifecycle и renderer остаются настоящими. Нативное ручное управление файловым диалогом не проверено.

Из Extensions устанавливает project-info и orbit; закрывает приложение, запускает тот же собранный код без повторной сборки, открывает внешний panel и создаёт Orbit. Видимый ring подтверждён screenshot, Canvas содержит прозрачные и непустые пиксели. Это **не проверка экспортированного видео**. Затем переключает RU/EN и проверяет отсутствие Orbit при --safe. Renderer page errors: 0.

Скриншоты start.png/editor.png/extensions.png просмотрены визуально. Два текста сначала пересекались, поскольку дубликат сохраняет координаты; сценарий затем сдвигает второй по Y, это ожидаемое поведение модели. Артефакты: artifacts/screenshots и artifacts/ui-results.json (игнорируются Git; восстанавливаются тестом). Эталон t6.png просмотрен: исходное облако, звёзды, нити, текст. Исходник и копия совпали по SHA256.

Найденные и исправленные ошибки: stale props Dockview (переведено на context), ESM protocol CORS (corsEnabled + headers/MIME). Первые неуспешные UI-прогоны не считаются passed. Финальный повтор после exact module lock прошёл.

Новый участок D: fault injection после metadata, backup и до индекса; fallback после повреждения/отсутствия primary; запрет перезаписи другого project ID; реальный дочерний процесс удерживает lease, второй получает отказ, kill освобождает lease. Проверены retry после ошибки черновика и новые правки во время задержанной записи: финальный черновик содержит последний снимок, explicit Save baseline не изменён.

Новый UI-тест: два разных userData-профиля Electron открывают одну папку — второй получает понятный отказ. После app.exit(77) основной процесс запускается вновь, показывает recovery и восстанавливает несохранённую копию. Исходный index остаётся неизменным; Save деактивирует кандидат. Повреждение index открывает предыдущую версию с предупреждением. Отдельно закрыто последнее окно до истечения debounce; before-quit дописал последнюю правку, повторный запуск её восстановил. Выбор кнопки native prompt, как и file dialogs, подменён тестом; остальные lifecycle/storage операции настоящие.

При финальной проверке найдена гонка быстрого duplicate → edit: fields могли ещё ссылаться на прежний object. Теперь структурная команда блокирует редактируемые controls до подтверждённого snapshot, старшие revisions не заменяются старыми ответами. Повторная проверка независимых дубликатов и отдельного окна прошла. В UI-тесте восстановления также исправлены ожидания завершения асинхронных операций; ранние неуспешные прогоны не считаются passed.

Общий стиль просмотрен на 900×650 и 1920×1080, в recovery и Extensions. Исправлено перекрытие variables встроенной темой Dockview из-за внутренней обёртки. Computed tabs background теперь rgb(13,19,30), совпадает с --studio-bg. Escape закрывает modal с возвратом focus; горизонтальный document overflow в малом окне не обнаружен. Артефакты: artifacts/recovery-ui-results.json, artifacts/screenshots/recovery.png, autosave.png, backup-recovery.png, editor-compact.png, editor-1080.png, extensions-compact.png.

Vite сообщает chunk >500KB; это предупреждение, оптимизация ещё не выполнена. Нет проверки clean install/installer, других ОС, OBS, FFmpeg/alpha video/audio, GPU, DPI/monitor transitions, физического power-loss и cross-machine/network share locking, обновлений module versions, вредоносного extension code и полной матрицы требований.
# Проверка собственного тумана — 16.10.2026

Добавлены tests/fog.test.ts, tests/fog-smoke.mjs и tests/fog-render-harness.ts. Проверяются аналитический seek/loop, отключение нулевой плотностью/opacity, валидация select/step, независимые copies/history, folder roundtrip, реальные пиксели Canvas после 6→12→6, RU/EN, save/open, renderer disposal и UI 900×650/1920×1080. Общий runner tools/ui-tests.mjs включает все три Electron-сценария. В artifacts/fog-ui-results.json сохраняется замер 30 render-вызовов одного слоя, без vsync и полного pipeline приложения. Не считать его гарантией FPS. Подробности и ограничения — fog.md.

## Навигация холста — 16.10.2026

TypeScript, boundaries, 11 behavior tests, build и четыре Electron-сценария прошли после добавления zoom/pan/fit. Navigation smoke проверяет координату под курсором при wheel, оба способа pan, Space после кнопки toolbar и ввод в числовое поле, presets, Home/1, 800%, fit после resize, независимые камеры, RU/EN и неизменность полного Snapshot. Осмотрены screenshots/navigation-compact.png и navigation-1080.png. Evidence — artifacts/navigation-ui-results.json. Промежуточная проверка двух панелей потребовала уточнения локаторов: Dockview временно держит оба tab contents видимыми при переключении; финальный тест проверяет каждый camera select отдельно. Все четыре UI-сценария повторно пройдены на итоговой сборке. Физические touchpad/pinch и HiDPI не проверены.

## Звёзды и редактирование — 16.10.2026

TypeScript, boundaries и 14 behavior tests прошли. Новые stars и editing smoke проверяют прозрачность/seed/seek, нулевой count, независимые слои, RU/EN, folder roundtrip, 1000/5000 stars, bounded sprite cache/disposal, выбор повёрнутого поля, drag 50%/200%, один undo, Esc, отмену при чужой revision и detached Properties. Проверены pause/resume без сброса кадра и отсутствие вызовов clearRect на неизменившейся pause. Окна 900×650/1920×1080 сняты после ожидания fit. Evidence: stars-ui-results.json, editing-ui-results.json и screenshots/stars-*, editing-*.

После сохранения renderer между кадрами промежуточный fog smoke обнаружил несовпадение пикселей при density 0→55. Для локальной маски задан willReadFrequently:true; повторная точная проверка прошла. Общий runner теперь включает шесть Electron-сценариев. Ручки размера/поворота, snapping, единые часы и экспорт пока не проверяются, поскольку не реализованы.

Итоговый полный UI runner прошёл все шесть сценариев. Промежуточный editing smoke выявил гонку перехода к новому масштабу: теперь масштаб жеста берётся из фактического Canvas rect, тест ждёт применения preset. Resize screenshots ждут также соответствия innerWidth/innerHeight реальному content size окна, затем fit; ранее одно ожидание fit могло завершиться до resize. Добавлена проверка отмены drag при resize. Итоговые stars-1080 и editing-compact визуально осмотрены. Финальные проверки не заменяют ручные проверки других устройств/DPI и длительной нагрузки.

Уточнение ожиданий resize: getContentSize сразу после setSize мог ещё возвращать старый размер. window-helpers.mjs ждёт native resize, ожидаемый client size с учётом рамки окна и шесть последовательных RAF с неизменной геометрией Dockview/Canvas. Это устранило ложное раннее завершение проверок и устаревшие screenshot geometry. Последний editing-compact показывает fit 19% и сцену целиком; весь UI runner повторно прошёл с новым helper.
