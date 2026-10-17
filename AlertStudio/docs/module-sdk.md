# SDK 0.1 — внутренний экспериментальный

StarPoint.baseX/baseY optional: исходные локальные координаты без анимационного дрейфа/блуждания. Network topology=stable выбирает соседей по ним, затем рисует текущие x/y. При отсутствии metadata использует x/y, поэтому внешнему эффекту для устойчивого графа нужны постоянные ID и rest coordinates. Project format/SDK version не изменены.

Runtime StarField.cloud optional содержит {offsetX,offsetY,width,height,field:CloudField}; offset — мировой относительно центра primitive stars. Network может использовать это для маски без отдельного project source setting. Primitive.warning поддерживает missing-mask; SceneEvaluation преобразует его в одноимённую диагностику. Профили NetworkFrame edges.samples — только runtime data; формат проектных значений не меняется. См. line-mask.md.

Условные settings поддерживают optional when.and: плоский массив до 8 дополнительных {key,equals}. Properties проверяет все условия вместе, Ajv отклоняет неизвестные ключи. CloudField/CloudBillow расширены optional параметрами огибающей и baseRadius; StarPoint.densityAlpha отделяет затухание в облаке от мерцания. Общие pure функции cloudDensity/densityPlacement находятся в core/geometry/density.ts и не требуют Canvas. См. fog-density.md для ограничений модели.

Готовый пакет — каталог с manifest.json и ESM entry.js. Manifest: id, version, kind (`panel`/`effect`), sdk (`0.1`), entry, точные dependencies, backends и inventory `files: {relativePath: sha256}`. Исполняемые и вспомогательные файлы должны быть в inventory; entry обязателен. Пути ограничены, symlink/выход за каталог и более 20MB отклоняются. Хеш подтверждает целостность, не доверенность автора.

`export function register(host)` регистрирует React-панель или нейтральный эффект. Host предоставляет ровно одну копию React; пакет не должен импортировать собственный React или bare modules. Отдельная esbuild-сборка выполняется tools/module-builder/build.mjs. Пользователь устанавливает ready package через Extensions, без сборки приложения и npm install.

PanelProps.interactionPending — добавленное optional UI-поле SDK 0.1: панель с редактируемыми полями должна блокировать ввод на время структурной команды или явной операции проекта. Это предотвращает отправку правки старому target при быстрой смене выделения. Простое текстовое изменение не блокирует весь интерфейс. Для оформления наследовать общую тему; правила — design-system.md.

Панель выполняется в renderer окна. Внешний эффект оценивается в renderer Canvas. Передача декларативных настроек в main нужна для проверки команд и defaults; внешняя функция туда не передаётся. Отдельного export render-host ещё нет, его проверка обязательна до предварительного статуса SDK. Фазы image modifiers, simulation modifiers и exporters пока не поддерживаются.

Ресурсы доступны по `studio://extensions/<id>/<version>/<inventory-path>`; разрешены только активированные файлы. CORS допускает studio://app, MIME задан явно, CSP блокирует сетевые источники. Нет eval и загрузки произвольного кода из project.json. Renderer-расширения доверенные: это не sandbox для враждебного кода. Они могут заблокировать UI и вызвать доступные UI-службы.

Установка: validate source → copy inventory в staging → повторная валидация → rename в installed/id/version → ready-маркер. Staging и установленные версии без ready не исполняются. Активация после перезапуска. Повторный ID и обновление отклоняются; управление версиями/откатом и UI отключения ещё предстоят. Ошибка стартовой валидации отключает весь внешний набор и записывается в console. Ошибки регистрации выводятся в status.

Регистрация откатывает добавленные entries при синхронной ошибке; register может вернуть dispose для подписок. Полная изоляция ошибок, async rollback и реестр cleanup-ресурсов ещё нужны.

Экспериментальный Canvas-контракт вынесен в sdk/canvas2d.ts: host.registerCanvasRenderer({kind,create}), экземпляр с draw(context,primitive)/dispose. Primitive может содержать нейтральные data и ownerId; CanvasPanel назначает ownerId из UUID объекта, backend создаёт renderer на пару ownerId/kind и освобождает при исчезновении из кадра. Неизвестные kind пропускаются. Canvas-типы не попадают в sdk/index.ts и модель проекта. Export host пока не реализован.

Setting поддерживает optional group (id + ru/en), step и type:select с options (value + ru/en). Properties использует общие theme controls, для select сохраняет исходный тип value. Значения вне диапазона, не соответствующие step или отсутствующие в options отклоняются командной моделью. Дополнения относятся к внутреннему эксперименту SDK 0.1.

Добавлены type:source/sourceType и optional when {key,equals}. Источник — UUID в обычном примитивном setting value. evaluate(values,time,context?) может запросить context.source<T>(settingId), получив Primitive<T> источника. core/scene/evaluate проверяет тип/существование/cycles, вычисляет источник один раз на кадр и отделяет зависимости от порядка рисования. Модули с прежними двумя аргументами evaluate продолжают работать. Primitive.warning='limit' выводит notice. Это экспериментальная внутренняя API; exports и полная версия расширенных contracts ещё не приняты.

Effect.editor — optional контракт геометрии редактора: position задаёт ключи координат, bounds(values, measureText) возвращает центр/размер/rotation в радианах. MeasureText получает текст и строку font и возвращает ширину без DOM в SDK. Loader исключает editor из definition при передаче в main. Для перетаскивания используется команда patch {id,values,revision}: все значения валидируются атомарно, устаревшая revision отклоняется, успешная правка выбирает объект и создаёт одну запись истории. Модуль без editor продолжает работать через Layers/Properties.

Для зависимых объектов position может быть функцией от values, а bounds получает третий optional context. Это позволяет linked stars наследовать геометрию fog и изменять offset keys при drag. Постоянные position старых эффектов сохраняют поддержку. См. linked-scene.md.

Переход к предварительному SDK: проверить внешние панель и эффект, экспортный host, жизненный цикл, обновление пакета и сохранение точных версий. Переход к стабильному: несколько разных модулей, модификаторы и экспорт, миграция старого проекта. Сейчас breaking changes допустимы с изменением версии SDK и примеров.
