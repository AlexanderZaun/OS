# Настройки

Условие when={key,equals,and?:[{key,equals},...]} показывает параметр при выполнении основного условия и всех дополнительных (1–8, без вложенности). Значения отсутствующих полей берутся из defaults definitions. Ajv проверяет наличие всех referenced keys. Новые densityBias/Fade используют одновременно fieldMode=cloud и cloudDistribution=density; это правило влияет только на показ controls, а не на сохранение значений.

Самостоятельное определение — `*.setting.json`: постоянный id, type (`number/string/color/select`), default, min/max, optional step, unit, animatable, label.ru/en. Optional group задаёт id и label.ru/en; select содержит options с value и label.ru/en. Типы проверяются TypeScript для встроенного кода; проект, команды и внешние definitions — Ajv. Дополнительно проверяются дубли ID, тип/диапазон/step default, цвет и допустимость select. Ключи переводов вместо inline label — незавершённая работа.

Сохранённое значение — отдельный `settings/<id>.json` с `{value: ...}`. Defaults копируются при создании. Неизвестные параметры сохраняются при повторном сохранении; отсутствующий эффект не удаляет данные. Составные значения, keyframe tracks, миграции и версии поведения ещё не реализованы; текущий Value ограничен примитивами.

Добавлен type:source с sourceType=effect ID и default пустой строкой. Сохранённое значение — UUID в отдельном settings/source.json; удаления не стирают dangling ссылку, UI показывает проблему. Назначение проверяется core по типу/существованию/self/cycle. Optional when {key,equals} управляет показом поля по другому setting/default и валидируется Ajv. Значения и ссылки остаются примитивами; format 1 сохранён.
