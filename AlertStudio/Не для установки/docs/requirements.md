# Состояние требований

[Русский](<requirements.md>) · [English](<en/requirements.md>) · [Оглавление](<README.md>)

Обновлено для 0.2.0, 18.10.2026. «Частично» — проверенный поднабор, не полная готовность. Исходное задание сохранено вне приложения в ../../prompt-ru.md; текущий приоритет задаёт development-plan.md.

| Область | Состояние |
|---|---|
| Панели/SDK | Встроенные и отдельно установленные project-info/orbit, общая модель и окна проверены; SDK экспериментальный |
| Эффекты/связи | Fog/stars/network, UUID sources, область, density/mask/topology работают; прочие эффекты и multi-source впереди |
| Сохранение | Многофайловые ревизии, exact versions, unknown values, backup index, lease и Recovery проверены при process failures |
| UI RU/EN | Словари/подписи и переключение работают; полный accessibility/localization audit не пройден |
| Четыре области | Общая композиция, длительности и group fade работают; overrides/keyframes/montage отсутствуют |
| Слои/свойства | Rename/reorder, lock/Solo/tags, blend/clip/color, search/reset/copy/history работают |
| Холст | Zoom/pan/fit/select/drag работают; resize/rotate handles, snapping и multiple selection отсутствуют |
| Экспорт | Прозрачный PNG кадра работает; PNG sequence/WebM/GIF/audio export отсутствуют |
| Пресеты/ассеты | Пример и creation templates работают; пользовательская библиотека/migrations/assets ещё нужны |
| Переносимая программа | Самодостаточный Windows x64 ZIP опубликован; перенос C: → E: проверен; другой ПК/ОС не проверены |
| Производительность | Есть ограниченные harness/storage замеры; нет полного p95/p99/peak-memory/GPU/export аудита |
| Интеграции/звук | Не реализованы, внешние сервисы не входят в ближайший объём |

Полная приёмка студии не пройдена. Source ZIP, наличие интерфейсной кнопки или успешная сборка сами по себе не доказывают функцию. [Проверки](verification.md), [приоритеты](development-plan.md), [подробный каталог](feature-catalog-ru.md).
