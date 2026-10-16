# Настройки

Самостоятельное определение — `*.setting.json`: постоянный id, type (`number/string/color/select`), default, min/max, optional step, unit, animatable, label.ru/en. Optional group задаёт id и label.ru/en; select содержит options с value и label.ru/en. Типы проверяются TypeScript для встроенного кода; проект, команды и внешние definitions — Ajv. Дополнительно проверяются дубли ID, тип/диапазон/step default, цвет и допустимость select. Ключи переводов вместо inline label — незавершённая работа.

Сохранённое значение — отдельный `settings/<id>.json` с `{value: ...}`. Defaults копируются при создании. Неизвестные параметры сохраняются при повторном сохранении; отсутствующий эффект не удаляет данные. Составные значения, keyframe tracks, миграции и версии поведения ещё не реализованы; текущий Value ограничен примитивами.
