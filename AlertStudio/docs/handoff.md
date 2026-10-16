# Продолжение

Вся реализация в C:/Life/OS/AlertStudio. Корневые prompt-ru.md и smoke-configured.html не изменены и не добавлены автоматически в Git. Прочитать AGENTS.md, README, requirements, roadmap и reference-audit.

Рабочий checkpoint: Windows Electron, trusted runtime ESM packages, независимая модель/история, текст/Orbit Canvas, generic properties, отдельные окна, revision folder save/open. SDK experimental 0.1; полная приёмка основы не пройдена. Последняя проверка: typecheck, boundaries, 4 logic tests, build, Electron smoke — passed. Ref capture и CPU/storage benchmark выполнены.

Запуск: `pnpm build; pnpm start`. UI regression: `pnpm test:ui`. Если pnpm не в PATH, использовать путь из README. Electron dist скачан штатным install.js; pnpm allowBuilds задан в pnpm-workspace.yaml. node_modules/dist/artifacts/.test-data не коммитятся.

Ближайший конкретный шаг: закрыть надёжность D до графического расширения — folder lock между процессами, fsync/резервный индекс, separate autosave/recovery; добавить fault tests после записи metadata и до commit index. Затем перенести standard fog texture + fogPosition + cloud mask из строк 1173–1518 в независимые state/simulation и специализированный Canvas renderer, сохранив произвольные UUID. Сравнить два независимых fog с baseline по фиксированному времени; не заменять алгоритм простыми градиентами с названием «туман».

Незавершённое по loader: updates/rollback versions, disable UI, dependency failure propagation, async registration rollback, подробная package provenance, и экспортный host. Сейчас duplicate install ID отклоняется, ready activation только после restart. Частично установленная папка без ready инертна, но повторная установка поверх её version может требовать восстановления — закрыть это тестом.

Незавершённое по UI: pinned Properties, настоящая detach/return конкретного instance, сохранение геометрии окон/monitor recovery, grouping/drag/reorder/zoom/pan, единый playback clock, full localization audit и text overflow/font policy. properties/history реагируют на каждый ввод; drag/text edit grouping ещё нет.

Незавершённое по данным: сложные setting values, stages/tracks/assets/presets, behavior/settings schema versions и migration backups. Exact module versions сохраняются; другой version не используется для редактирования/отрисовки до миграции. При отсутствии модуля settings сохраняются, Properties показывает диагноз, Canvas placeholder ещё нужен.

E–I: GPU experiment, fog/text parity, pulse blocks, montage/audio, остальные effects, imports, PNG/GIF/WebM alpha/MP3, bounded export, лицензирование encoder, installer и чистая Windows installation. Интеграции внешних сервисов не реализовывать сейчас.
