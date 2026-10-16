# Текущее отображение

Canvas2D backend принимает text/rect primitives. Координаты — scene pixels, время — секунды, preview масштабируется CSS пропорционально. Прозрачный checkerboard — CSS, он не попадает в пиксели Canvas. Порядок объектов в массиве — back-to-front, Layers показывает его в обратном порядке. Пока нет blend modes и сложных масок.

Текст использует Arial с sans-serif fallback, кириллица проверена в Windows. Явные переносы строк поддержаны; ширина ограничена fillText maxWidth, то есть длинная строка сжимается. Полноценный перенос по словам, overflow policy и воспроизводимая поставка шрифтов остаются задачами переноса textLayout из референса.

Orbit — аналитическая анимация, seek пересчитывает её из time. Playback не меняет модель/dirty/history. Показания time пока редактируемая точка seek, не live playhead. Панели Canvas могут иметь независимые preview clocks; единый монтажный clock ещё отсутствует. Каждый дополнительный Canvas стоит отдельного render loop, это не общее бесплатное представление.

Туман и stateful scattering из референса ещё не перенесены. Для scatter нужен фиксированный шаг/checkpoints. Reference baselines используют replay 60Hz; прямой seek без replay дал бы иное состояние. Экспорт и GPU experiment пока отсутствуют.
