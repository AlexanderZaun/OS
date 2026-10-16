# Архитектура текущего участка

`contracts/project.ts` описывает данные и команды. `core/project/service.ts` — единственная авторитетная модель и история в Electron main; snapshots копируются, UI не владеет истиной. `core/modules/order.ts` проверяет ID и граф точных зависимостей. Ядро не импортирует платформенные библиотеки.

`sdk/index.ts` — независимые данные эффекта, определения настроек, примитивы и backend. `sdk/ui.ts` — явно React-специфичный контракт панели. Built-in панели и внешний пример вызывают один `register(host)`; стандартный эффект использует `registerEffect`. Bootstrap связывает службы; Dockview знает о размещении, содержимое панели — нет.

Данные передаются между окнами только при командах; частицы по IPC не передаются. История общая. Snapshot содержит revision, но optimistic revision/conflict rejection пока отсутствует: команды последовательно применяет main. Canvas каждого открытого экземпляра выполняет собственную аналитическую оценку; тяжёлая общая симуляция ещё не реализована.

Electron bridge предоставляет конкретные методы, не произвольный send/invoke. Проверяются sender, main frame, команды и project JSON. Node integration выключен, context isolation и renderer sandbox включены. Проект не исполняет код, lock-файл не устанавливает пакеты.

`Files` хранит неизменные многофайловые ревизии; индекс переключается после записи. `Extensions` проверяет manifests, хеши, пути и зависимости, устанавливает staging и публикует ready-маркер. Стартовая загрузка повторно проверяет пакеты. Runtime ESM загружается в renderer через `studio://extensions`. В main исполняются только встроенные исходники.

`app/bootstrap/project-session.ts` связывает авторитетный Projects, явное сохранение Files, RecoveryStore и FolderLease. Черновики имеют отдельную сериализованную очередь, не меняют saved baseline и не блокируют обычное редактирование. Явные create/open/save/restore сериализованы через busy; неудачное open сохраняет текущую модель и lease. После успешной смены проекта старая lease освобождается. UI принимает snapshots по возрастанию revision; структурная команда временно блокирует поля свойств, пока новое выделение не подтверждено.

Общий стиль: ui-kit/theme.css задаёт палитру и контролы, workspace adapter отображает их в переменные Dockview, ui-kit/Dialog.tsx управляет focus/Escape/Tab для системных in-app диалогов. Canvas checkerboard — часть preview, не экспортируемая подложка. Native Windows file dialogs/close prompt остаются системными.

Контракты ResourceService, EncoderAdapter и WindowAdapter пока предварительные; ResourceService/EncoderAdapter не имеют рабочих реализаций. Workspace и окно пока подключены конкретными адаптерами. SDK не объявлен стабильным.
