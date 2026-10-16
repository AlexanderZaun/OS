# Матрица требований

Принят весь объём пользовательского задания из ../prompt-ru.md и приложения к чату. Исключены на текущей стадии: Twitch/DonationAlerts/StreamElements integrations, live OBS server и встроенный AI. Экспорт файлов остаётся обязательным, пока не реализован. Windows — первая ОС, другие ОС не проверены.

«Частично» означает работающий поднабор, а не прохождение полного требования. Ни наличие документа, ни сборка не заменяют проверку.

| ID | Требование | Реализация | Проверка | Статус |
|---|---|---|---|---|
| R01 | Самостоятельные панели | panel SDK + project-info package | Install через Extensions в собранное приложение, restart/open | Пройдено для первого примера |
| R02 | Эффекты и блоки | внешний Orbit; modifiers отсутствуют | Runtime install/render Orbit | Частично |
| R03 | Раздельные определения | text и orbit settings JSON | Generic Properties отображает radius | Частично: составные значения впереди |
| R04 | Многофайловый проект | revision tree, independent values | Roundtrip, inspect tree, UI save/open | Пройдено для текущих данных |
| R05 | Согласованное сохранение | Immutable revision, sync JSON, backup index, Windows lease | Metadata/backup/pre-commit fault injection, damaged/missing index, actual second process | Пройдено для сбоев процесса; power-loss/network shares не проверены |
| R06 | Независимость экземпляров | copy defaults, deep duplicate | Logic + UI text duplicates | Частично: fog/presets впереди |
| R07 | Заменяемость технологий | contracts/adapters/import guard | typecheck + boundaries | Частично: contracts не все подключены |
| R08 | RU/EN | platform dictionaries + module labels | UI switch | Частично: fallback/long-label/error localization audit |
| R09 | Старт/проект | create/open/save/save-as/dirty warning, autosave/recovery UI | Save/open, crash+normal-close recovery, unsaved restore copy | Частично: recent projects отсутствуют |
| R10 | Отдельные панели | дополнительные окна, общая служба | Edit + undo cross-window | Частично: перенос/monitor recovery впереди |
| R11 | Три этапа/две области | отсутствуют | — | Запланировано |
| R12 | Монтаж/звук | отсутствуют | — | Запланировано |
| R13 | Аудио режимы | отсутствуют | — | Запланировано |
| R14 | Перенос референса | аудит + три исходных baseline | Actual reference replay/capture | Частично: перенос графики не выполнен |
| R15 | Прозрачный экспорт | отсутствует | Проверена только альфа Canvas, не файл | Запланировано |
| R16 | Пресеты/совместимость | exact module versions, unknown values retained | Unknown-module roundtrip | Частично: presets/migrations отсутствуют |
| R17 | Циклическая подложка | отсутствует | — | Запланировано |
| R18 | Поздние интеграции | отдельные будущие exporter profiles/renderer bindings | Никаких service SDK/network calls в продукте | Документировано, интеграции исключены сейчас |
| R19 | Экземпляры панели | UUID, local preview state, layout JSON | UI additional Canvas, panel close | Частично: pin targets/restore missing target впереди |
| R20 | Порядок параметров | modifiers ещё нет | — | Запланировано |
| R21 | Связи объектов | UUID, remove/undo | Logic commands; links ещё нет | Частично |
| R22 | Base vs evaluated | evaluate pure, preview не dispatch | Logic before/after snapshot | Частично: keyframes/blocks впереди |
| R23 | Завершённая установка | staging/ready/inventory/revalidation | Inert staging + invalid hash | Частично: interruption tests расширяются |
| R24 | Проект не устанавливает код | data-only project reader | Unknown effect roundtrip, no runtime loader in reader | Пройдено для folder format |
| R25 | Производительность | CPU/storage benchmark 1/50/200 | tools/performance.mjs | Частично: UI frame time/GPU/export ещё нет |
| R26 | Развитие SDK | experimental 0.1, gates documented | External panel+effect tested; export не проверен | Экспериментальный |

Полная приёмка основы не пройдена: нет двух fog, дополнительных блоков, video alpha export и точного перемещения panel instance. Этап B подтверждён runtime-проверкой; C и D реализованы частично. Этапы E–I впереди.
