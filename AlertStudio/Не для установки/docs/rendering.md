# Отрисовка и preview

[Русский](<rendering.md>) · [English](<en/rendering.md>) · [Оглавление](<README.md>)

Canvas2D рисует text/rect и зарегистрированные специализированные primitives fog/stars/network/orbit. Координаты — пиксели сцены, время — секунды; preview масштабируется CSS. Массив объектов — back-to-front, панель Layers показывает обратный порядок. Checkerboard — только CSS.

evaluateScene кеширует источники на кадр независимо от z-order, включая скрытые. Диагностики missing/wrong/inactive/cycle/failed/limit отображаются на Canvas. RenderLayer задаёт общие blend/clip/hue/saturation/opacity; fade стадии применяется к объединённой композиции один раз. PNG использует те же renderers и исключает UI.

Общие часы main синхронизируют Canvas; камеры локальны. Pause сохраняет кадр, resume продолжает; неизменный paused frame не перерисовывается. Каждый дополнительный Canvas выполняет собственную работу. Renderer освобождается при исчезновении объекта и закрытии view.

Текст использует Arial/sans-serif и явные переносы; длинная строка может сжиматься fillText maxWidth. Автоматический word wrap, полный typography engine и воспроизводимая поставка шрифтов ещё нужны. Аналитические эффекты поддерживают seek; stateful collisions потребуют fixed step/checkpoints.

PNG текущего кадра реализован; WebM/другие video encoders, GPU/Pixi backend и универсальный export-host отсутствуют. Точные ограничения маски — [здесь](line-mask.md), слоёв — [здесь](layer-compositing.md).
