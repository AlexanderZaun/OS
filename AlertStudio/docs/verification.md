# Реально выполненные проверки — 16.10.2026

Среда: Windows (win32), Node 24.19.0, pnpm 11.25.0, Electron 44.8.0, React 19.3.1, Dockview 8.5.1, Vite 8.3.4, TypeScript 5.9.3. Типы и filesystem/GUI тесты выполнялись разрешённым запуском вне managed sandbox: внутри sandbox pnpm junction declaration lookup и TEMP rename/realpath дали ошибки доступа. Эти ошибки не выдаются за ошибки продукта или успешные sandbox-проверки.

| Команда | Результат |
|---|---|
| node node_modules/typescript/bin/tsc --noEmit | exit 0 |
| node tools/check-boundaries.mjs | 7 независимых файлов, проверка пройдена |
| node tools/test.mjs | 4 поведенческих теста, 4 passed |
| node tools/build.mjs | desktop/UI и 2 отдельные пакета собраны |
| node tests/electron-smoke.mjs | Windows Electron UI smoke пройден |
| node tests/reference-capture.mjs | оригинал запущен, t=0/6/12 сохранены |
| node tools/performance.mjs | 1/50/200 объектов, результаты сохранены |

Logic tests: независимость defaults/duplicate, undo/redo, чистая evaluate, отклонение команды с лишними полями, многофайловый roundtrip, сохранение неизвестного эффекта/значения, сбой на третьем value и повторное открытие старой ревизии, несовместимый SDK/дубли ID/отсутствующие и циклические dependencies, inert staging, install и hash/path rejection.

UI test запускает **собранный** Electron без Vite server. Через настоящие кнопки создаёт проект, добавляет два текста, изменяет их, открывает отдельное окно Properties, меняет текст там и отменяет из главного окна. Сохраняет/открывает папку. Диалоги выбора папки подменены тестом на фиксированные пути; установка, файловые операции, protocol, dynamic import, lifecycle и renderer остаются настоящими. Нативное ручное управление файловым диалогом не проверено.

Из Extensions устанавливает project-info и orbit; закрывает приложение, запускает тот же собранный код без повторной сборки, открывает внешний panel и создаёт Orbit. Видимый ring подтверждён screenshot, Canvas содержит прозрачные и непустые пиксели. Это **не проверка экспортированного видео**. Затем переключает RU/EN и проверяет отсутствие Orbit при --safe. Renderer page errors: 0.

Скриншоты start.png/editor.png/extensions.png просмотрены визуально. Два текста сначала пересекались, поскольку дубликат сохраняет координаты; сценарий затем сдвигает второй по Y, это ожидаемое поведение модели. Артефакты: artifacts/screenshots и artifacts/ui-results.json (игнорируются Git; восстанавливаются тестом). Эталон t6.png просмотрен: исходное облако, звёзды, нити, текст. Исходник и копия совпали по SHA256.

Найденные и исправленные ошибки: stale props Dockview (переведено на context), ESM protocol CORS (corsEnabled + headers/MIME). Первые неуспешные UI-прогоны не считаются passed. Финальный повтор после exact module lock прошёл.

Vite сообщает chunk >500KB (625KB JS, 164KB gzip); это предупреждение, оптимизация ещё не выполнена. Нет проверки clean install/installer, других ОС, OBS, FFmpeg/alpha video/audio, GPU, drag/pan/DPI/monitor transitions, autosave/power-loss, обновлений module versions, вредоносного extension code и полной матрицы требований.
