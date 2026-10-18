# Создание панели

[Русский](<creating-panel.md>) · [English](<en/creating-panel.md>) · [Оглавление](<README.md>)

Рабочий образец — examples/project-info. Пакет экспортирует register(host), получает React от host и регистрирует panel ID и подписи ru/en. Компонент читает snapshot и отправляет команды через dispatch; он не хранит авторитетную копию проекта.

Используйте общие theme tokens и host font, наследуйте panel-body. interactionPending должен блокировать редактируемые поля во время структурных операций. workspace опционален: не предполагайте его наличие в отдельном окне. Raw Electron/Dockview/IPC не выдаются.

Соберите пакет отдельно, установите через Extensions и перезапустите. Проверьте несколько экземпляров, общий проект/undo, закрытие и dispose подписок, RU/EN, узкую панель и отдельное окно. Для диалогов используйте общий Dialog. Подробности: [SDK](module-sdk.md), [стиль](design-system.md).
