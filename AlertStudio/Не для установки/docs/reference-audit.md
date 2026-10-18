# Визуальный референс: аудит

[Русский](<reference-audit.md>) · [English](<en/reference-audit.md>) · [Оглавление](<README.md>)

Исторический источник: C:/Life/OS/smoke-configured.html, 4522 строки, 225055 байт; неизменная копия — reference/original/smoke-configured.html. Зафиксированный SHA-256: F542F3BCACDB5F6C6B07E0BB6511E79B295F458BD26D091CEF8757674DEB4FD0. Приложение не встраивает этот HTML и не исполняет его как проект.

Исходная конфигурация: version 2, seed 8197, 48 с, сцена 1920×1080, cloud 900×480, центр 50/50%, clearCenter .42. В оригинале фиксированы fog1–fog4; AlertStudio использует произвольные UUID и явные sources.

| Область | Вывод для AlertStudio |
|---|---|
| Fog geometry/noise/motion | Собственная реализация уже есть; дополнительные формы/движения впереди |
| Small/large stars и network | Собственные связанные системы уже есть; flying/flow ещё нет |
| Dark Base/Edge Light | Отдельные будущие объекты, не считать сетью любые нити референса |
| Text layout | Нужны wrap/fit, typography и локальные test events |
| Lifecycle | Базовые четыре области есть; индивидуальные анимации впереди |
| Presets/resize/export | Не смешивать желаемые reference-функции с текущими; PNG/portable уже есть |

Для исследования используйте reference-capture/focused-capture scripts и фиксированные t=0/6/12, seed, размер/фон. Исходник не изменяйте; focused-настройки применяйте только в тестовом экземпляре. Побайтовый parity не является целью пользователя. Старые аудиты сохранены локально; текущие статусы — [requirements](requirements.md).
