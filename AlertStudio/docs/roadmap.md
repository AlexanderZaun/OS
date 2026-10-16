# Состояние этапов

- A: исследован пустой репозиторий, найден и сохранён оригинальный HTML, подготовлены аудит и эталоны.
- B: рабочий SDK/loader/validator, отдельные пакеты панели и эффекта; установка в собранный Electron, активация после restart и открытие подтверждены.
- C: холст, слои, generic свойства, текст, дублирование, visibility, history и отдельные окна подтверждены. Canvas manipulation, панель pin, полноценный перенос экземпляра и monitor recovery отсутствуют.
- D: раздельный проект, exact module lock, неизвестные данные, process-failure transaction, sync JSON, проверенный резервный индекс, Windows folder lease, debounce autosave и восстановление черновиков проверены. Power-loss, network-share координация, retention и очистка ревизий не проверены/не реализованы.
- E: следующий графический участок — специализированный Canvas SDK для тумана, два независимых fog, reference visual comparison; затем WebM alpha experiment и GPU comparison.
- F: пульсация/дополнительные блоки, preset copy/migrations, external modifier — запланированы.
- G: три этапа, montage, единый clock, звук, seek/history — запланированы.
- H: stars/flying/flow/lines/edge/strands/scatter и importer — по reference-audit, пока не перенесены.
- I: PNG/GIF/WebM/MP3, audio modes, bounded export, cancellation, licenses, installer и clean-machine test — запланированы.

Не считать B эквивалентом полной приёмки основы. Текущая версия — рабочий checkpoint runtime-модулей и модели, без обещания завершённой студии.

Интерфейс: единые tokens ui-kit/theme.css, общий Dialog для Extensions/recovery, тема Dockview, компактные поля и состояния кнопок. Проверены реальные окна 900×650 и 1920×1080; дальнейшие панели обязаны использовать ту же систему.
