# Продолжение после звёзд и редактирования холста

Вся реализация в C:/Life/OS/AlertStudio. Прочитать AGENTS.md, README, requirements, roadmap и design-system. Корневые prompt-ru.md и smoke-configured.html не изменять. Пользователь требует собственные решения под приложение; reference служит визуальным ориентиром, копирование алгоритмов и pixel parity с ним не требуются.

## Текущий результат — 16.10.2026

Работают Windows Electron, внешние ESM панели/эффекты, текст, встроенные fog/stars и пример Orbit. Stars 0.1.0 имеет 20 отдельных settings: два распределения, размеры, палитра, glow, мерцание и дрейф. Модель нейтральная и детерминированная; renderer кеширует шесть 64×64 спрайтов на экземпляр и освобождает их. См. stars.md.

Холст: wheel к курсору, zoom presets/fit, Space/middle mouse pan, Home/1. Добавлены выбор верхнего text/fog/stars по области, повёрнутая рамка и перетаскивание. Preview локальный, отпускание отправляет атомарный patch двух координат с исходной revision; один undo. Esc, потеря фокуса/захвата и чужая revision отменяют жест. Модули без optional Effect.editor на холсте не выбираются. Внешний loader исключает editor callback из декларативного IPC definition. См. canvas-editing.md и canvas-navigation.md.

Pause сохраняет кадр, resume продолжает; time показывает текущее время. Renderer не пересоздаётся на seek/play/pause, paused-кадр без изменений не перерисовывается. При новом project.id время сбрасывается. Общие часы между панелями пока не реализованы. Fog mask context использует willReadFrequently:true: после изменения lifecycle точный pixel replay при выключении/включении первоначально не прошёл; явный режим чтения маски исправил проверку.

## Проверки и evidence

TypeScript, boundaries (9 файлов), 14 behavior tests, build. UI runner содержит 6 реальных Electron-сценариев: baseline extensions/text, recovery/theme, fog, navigation, stars, canvas editing. Проверки включают независимые копии, pixel seek 6→12→6, pause/resume и отсутствие redraw на pause, сохранение/открытие, отдельные окна, cache/disposal, drag 50%/200%, Esc и concurrent edit. Native file/confirmation dialogs в тестах подменены.

Evidence: artifacts/ui-results.json, recovery-ui-results.json, fog-ui-results.json, navigation-ui-results.json, stars-ui-results.json, editing-ui-results.json и screenshots. Для новых screenshots ожидается завершение ResizeObserver/fit после resize. Осмотреть stars/editing-1080 и compact. Harness timings для 1000/5000 stars включают evaluate + render, без React/vsync/export; не считать их FPS всей студии.

Запуск — Launch.cmd. Проверки — node tools/test.mjs, node tools/build.mjs, node tools/ui-tests.mjs; pnpm пути описаны в README. Зависимости через Windows junction требуют выполнения проверок вне sandbox. node_modules, dist, artifacts и .test-data не коммитятся.

## Что делать дальше

План: docs/feature-catalog-ru.md — оглавление 10 блоков; docs/plan/*.md сохраняют все 218 пунктов/28 направлений. Блоки 1 и 6 обновлены фактическим состоянием. Следующие инструменты композиции: ручки размера/поворота, snapping и порядок слоёв; следующий новый эффект — молнии. Затем общий clock, модификаторы/гличи и экспорт без звука. Звук и внешние сервисные интеграции отложены. Не считать начальные fog/stars полной реализацией всех художественных вариантов.

## Не потерять гарантии и ограничения

Main владеет общей моделью/историей. Сохранённые values отдельно от definitions. Многофайловые immutable revisions, sync JSON, проверенный project.previous.json, локальная Windows folder lease на всю сессию, recovery вне проекта, debounce и flush при обычном выходе должны сохраниться. Полные revisions накапливаются; retention/GC и ограничение очереди черновиков впереди. Power-loss, network-share/cross-machine locking и другие ОС не проверены. До debounce при аварии возможна потеря последних правок.

Unknown effects/values сохраняются; миграции и Canvas placeholder впереди. Loader updates/rollback, disable UI, async registration rollback, dependency error propagation, provenance и export host не завершены. Расширения доверенные, не sandbox для враждебного кода.

Ручки transform, snapping, multiselect, reorder/group, pin Properties, detach/return конкретного instance, monitor recovery, сложные settings, fonts/wrapping, preset library и assets ещё не сделаны. Нет exports/GPU/installer/clean Windows verification. Тема — только ui-kit/theme.css, диалоги — ui-kit/Dialog.tsx; проверять 900×650/1920×1080 и RU/EN. Полная приёмка студии не пройдена.
