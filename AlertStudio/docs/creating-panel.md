# Создание панели

Рабочий пример: examples/project-info. Используйте `host.React` и `host.registerPanel({id,label:{ru,en},component})`. Props содержат snapshot, dispatch, language и effects. Локальное UI-состояние храните в экземпляре компонента, изменения проекта отправляйте командами. Отдельное окно получает ту же модель через bridge; не создавайте второй ProjectService.

Соберите ESM отдельно module-builder, создайте inventory с SHA256, установите готовую папку через Extensions и перезапустите. CSS примера ограничен inline-стилями. Общие CSS-селекторы расширения не допускаются. Закрытие панели не удаляет проектный объект.
