# Границы технологий

[Русский](<technology-boundaries.md>) · [English](<en/technology-boundaries.md>) · [Оглавление](<README.md>)

| Технология | Разрешённая область |
|---|---|
| React | Представления, bootstrap, UI SDK и адаптер Dockview |
| Electron | Desktop adapter и preload |
| Dockview | Workspace adapter; компоненты панелей не импортируют Dockview |
| Canvas API | Render adapter и явно Canvas-специфичный SDK |
| Ajv | Validation adapter |

Определения эффектов и сохраняемая модель не должны зависеть от этих библиотек. Замена UI потребует переписать React-панели; смена desktop host — файловые, оконные и IPC-адаптеры. Шейдеры не обещаются переносимыми без адаптации.

tools/check-boundaries.mjs разбирает imports/exports через TypeScript compiler API в core/contracts/sdk. Исключение для UI-контракта явно задано; это не полный транзитивный анализ или проверка каждого dynamic import. FFmpeg как отдельный exporter и Pixi не подключены. Наличие ffmpeg.dll внутри Electron не означает готовый экспорт видео.
