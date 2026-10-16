# Продолжение после recovery/style checkpoint

Вся реализация в C:/Life/OS/AlertStudio. Корневые prompt-ru.md и smoke-configured.html не изменены. Прочитать AGENTS.md, README, requirements, roadmap, design-system и reference-audit.

Работает Windows Electron с внешними ESM panel/effect packages, текстом/Orbit, общей моделью и историей, отдельными окнами и многофайловым проектом. Добавлены sync JSON, проверенный project.previous.json, Windows folder lease, debounce autosave в userData/Recovery, восстановление несохранённой копии и flush при обычном выходе. Полная приёмка основы не пройдена: fog, modifiers и экспорт ещё отсутствуют.

Проверки: typecheck, import boundaries (8 файлов), 9 behavior tests, build, external-module Electron smoke и recovery/theme Electron smoke пройдены. Сценарии recovery включают аварийный app.exit, второй процесс, повреждённый индекс, сохранение восстановленной копии и нормальное закрытие до debounce. У тестов file/native confirm dialogs подменены; реальные операции и окна выполняются. Evidence: artifacts/ui-results.json, recovery-ui-results.json, screenshots. Reference baselines не перерисовывались — оригинал не менялся.

Запуск: Launch.cmd или `pnpm build; pnpm start`. `pnpm test:ui` теперь последовательно запускает оба UI-сценария, `pnpm test:recovery` — только новый. pnpm путь и ограничения sandbox — в README. node_modules/dist/artifacts/.test-data не коммитятся.

Следующий конкретный участок — standard fog: texture + fogPosition + cloud mask из строк 1173–1518 reference/original. Выделить независимые state/simulation и специализированный Canvas renderer, сохранить произвольные UUID, отдельные definitions/values и версии поведения. Не заменять reference алгоритм простым gradient. Проверить два независимых fog, точное время/seed и baseline comparison; затем WebM alpha/export-host и раннее Canvas/Pixi сравнение.

Общий стиль обязателен: ui-kit/theme.css tokens, ui-kit/Dialog.tsx, компактные controls; без отдельной палитры в новых панелях. Dockview custom variables задаются на descendant `.workspace .studio-workspace` из-за внутреннего wrapper. Проверять 900×650 и 1920×1080. Native OS dialogs остаются системными. PanelProps.interactionPending — optional flag для запрета редактирования во время structural command/file operation; values должны изменяться у подтверждённого target.

Не обещать долговечность при физическом отключении питания: directory entry/rename и накопитель не проверены. Windows lease локальна машине; сеть/другие ОС не поддержаны. Полные ревизии пока накапливаются: retention/GC нужны. Утеря правок до debounce при аварии остаётся ожидаемым окном риска; обычный выход flush делает последний снимок. Unknown effects/values сохраняются, Canvas placeholder и миграции ещё впереди.

Loader: updates/rollback versions, disable UI, dependency failure propagation, async registration rollback, provenance и экспортный host ещё не завершены. Incomplete ready-less versions инертны; явное восстановление такой установки остаётся задачей.

UI/данные: pinned Properties, detach/return конкретного instance, геометрия окон/monitor recovery, grouping/drag/reorder/zoom/pan, единый playback clock, localization audit, text wrapping/fonts, compound settings, stages/tracks/assets/presets и migrations ещё впереди.

E–I: GPU experiment, fog/text parity, pulse blocks, montage/audio, остальные effects/import, PNG/GIF/WebM alpha/MP3, bounded export/cancel, лицензии encoder, installer и clean Windows installation. Внешние сервисные интеграции сейчас не реализовывать.
