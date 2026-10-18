# Продолжение разработки

[Русский](<handoff.md>) · [English](<en/handoff.md>) · [Оглавление](<README.md>)

## Текущий checkpoint

Версия 0.2.1 включает новую структуру папок, документацию RU/EN и презентацию приложения через GitHub Pages. Исходники фиксируются v0.2.1 и backup/2026-10-18-presentation-v0.2.1. Предыдущий v0.2.0/9dc7d2d и его assets сохранены. Публичные README находятся в корне репозитория, подробные developer guides — здесь.

В «Не для установки» находятся все исходники/инструменты/тесты/артефакты. Команды выполняются здесь. «Для установки» — соседний output из tools/distribution-paths.mjs. node_modules после переноса восстановлены: 95 junction-ссылок и pnpm virtualStoreDir. Старые пути C:/Life/OS/AlertStudio без вложенной папки не являются текущим cwd разработки.

Реализованы четыре базовые области и fade, общие layer styles и PNG, lock/Solo/tags, search/changed/reset, scoped copy/paste и visible history. История сначала открывается вкладкой у Properties; сеансовые clipboard/history не входят в Project. Геометрия, multi-source, новые художественные системы и расширенные стадии остаются будущими этапами.

## Где смотреть

- Projects в main — авторитетная модель; ProjectSession — save/recovery/lease.
- Source graph — core/scene/evaluate.ts; neutral geometry/density — core/geometry.
- Desktop/preload/portable — adapters/desktop-electron; compositing/PNG — adapters/render-canvas2d.
- Workspace — adapters/workspace-dockview; свойства/каталог/история — modules/panels.
- Общие токены/Dialog — ui-kit; пакетирование/публикация — tools.

## Перед следующим этапом

Документация: 59 пар RU/EN и два plain-text guide; check:docs включён в pnpm check. Временный прежний текст сохранён локально, новые страницы — обычные редактируемые Markdown, не зависят от генератора. Локальный чистый ZIP с двумя guide создан в «Для установки/Чистая сборка», потому что прежняя рабочая папка уже содержит Data. Для этой подпапки установите ALERT_STUDIO_RELEASE_DIR='Чистая сборка' в текущем терминале; общий helper используется упаковкой, portable-тестом и release tool. pnpm check и новый portable C:→E: прошли. Для будущей публикации release tool объединяет русские и английские notes; презентация входит в выпуск 0.2.1.

Прочтите [приоритеты](development-plan.md), [AGENTS](../AGENTS.md), [архитектуру](architecture.md) и [проверки](verification.md). Следующий согласованный участок — геометрия/сцена, не звук или внешние сервисы. Базовые intro/outro уже реализованы; расширенные индивидуальные анимации требуют согласования поведения.

Все пары документации поддерживаются вместе; pnpm check:docs проверяет покрытие и ссылки. Полный программный прогон: 81 tests/22 UI, build/portable/C:→E:. Для публикации нужна новая версия, явная авторизация и процедура [portable](portable.md)/[backups](backups.md).
