# Экспериментальный SDK 0.1

[Русский](<module-sdk.md>) · [English](<en/module-sdk.md>) · [Оглавление](<README.md>)

## Пакет и активация

Пакет — папка с manifest.json и ESM entry.js. Manifest содержит id, version, kind (panel/effect), sdk (0.1), entry, точные dependencies, backends и inventory files: {relativePath: sha256}. Entry и все ресурсы должны входить в inventory. Выход за каталог, symlinks, некорректные пути и размер более 20 MB отклоняются. Хеши не подтверждают доверие к автору.

export function register(host) регистрирует панель или эффект. Host предоставляет React; пакет не включает свою копию React и не использует неразрешённые bare imports. tools/module-builder/build.mjs собирает примеры project-info и orbit отдельно от приложения.

Установка: validate → copy inventory в staging → validate снова → rename в installed/id/version → ready marker. Пакеты без ready инертны. Активация после перезапуска повторно проверяет inventory и граф зависимостей. Повторная установка ID и обновление пока отклоняются; --safe отключает внешние пакеты. Ошибка стартовой проверки отключает внешний набор; синхронная ошибка register откатывает регистрацию. Полные async rollback и управление версиями не реализованы.

## Контракты

- sdk/index.ts — нейтральные Effect, Setting, Primitive и RenderLayer. evaluate(values,time,context?) может запросить context.source(settingId). Старые двухаргументные evaluate поддерживаются.
- sdk/ui.ts — React-специфичный PanelProps. interactionPending блокирует правки при структурных операциях. workspace — опциональные panels/open/detach без сырого Dockview/IPC; в отдельном окне может отсутствовать.
- sdk/canvas2d.ts — registerCanvasRenderer({kind,create}); экземпляр draw(context,primitive)/dispose. Backend создаёт renderer для ownerId/kind и освобождает после исчезновения объекта. Неизвестный kind пропускается.
- Effect.editor задаёт position и bounds(values,measureText,context?). Position может зависеть от values. Геометрия не требует DOM в нейтральном SDK; patch проверяет revision и создаёт одну запись истории.

Внешний код работает в renderer. В main передаётся только проверенное декларативное определение, без evaluate/editor функций. Ресурсы доступны через studio://extensions/&lt;id&gt;/&lt;version&gt;/&lt;inventory-path&gt;, только для активированных файлов; MIME/CORS заданы явно. CSP блокирует сетевые источники. Расширение доверенное: это не изоляция от враждебного кода, оно может блокировать UI.

## Добавления без смены SDK 0.1

when.and поддерживает дополнительные условия. StarPoint.baseX/baseY — rest coordinates устойчивой сети; постоянные ID нужны для воспроизводимого графа. densityAlpha отделяет облачное затухание от мерцания. StarField.cloud передаёт fog mask сети. Primitive.warning превращается в диагностику.

RenderLayer отделяет оформление от эффектов; render(primitives,opacity?,layers?) поддерживает старые вызовы без layers. Специализированный renderer участвует в общих слоях и PNG. Snapshot.clipboard/history — сеансовые данные вне Project; settings-copy/settings-paste/history-jump валидируются в main/core.

## Статус

Панель project-info и эффект orbit установлены и проверены после сборки и перезапуска, в том числе после переноса portable. PNG текущего кадра использует общий renderer; отдельный универсальный export-host для всех будущих форматов не реализован. Image/simulation modifiers, lifecycle registry, обновление/откат пакетов и проверка нескольких независимых сторонних модулей нужны до объявления SDK стабильным. См. [создание эффекта](creating-effect.md), [панели](creating-panel.md), [модификатора](creating-modifier.md).
