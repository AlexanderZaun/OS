# Переносимая программа и выпуск

[Русский](<portable.md>) · [English](<en/portable.md>) · [Оглавление](<README.md>)

## Использование

Windows 10/11 x64. Скачайте ZIP в [Releases](https://github.com/AlexanderZaun/OS/releases/latest), распакуйте полностью в доступную для записи папку и запустите AlertStudio.exe. Node.js/pnpm/интернет для обычной работы не нужны. Code → Download ZIP — исходники.

При первом запуске рядом с EXE создаётся Data: Profile — профиль/раскладки; Projects — первое Save; Recovery — отдельные черновики; Extensions — установленные пакеты; Logs/CrashDumps — диагностика. Save As позволяет внешнюю папку. Для переноса закройте приложение и переместите всю папку, включая Data/DLL/locales/resources. Внешние файлы переносите отдельно. Пробелы и кириллица в пути проверены.

Для обновления распакуйте новую версию отдельно и перенесите свою Data при закрытых приложениях. Не запускайте из ZIP или read-only папки. Сборка без отдельной подписи AlertStudio; Windows может предупредить при скачивании. Другой физический компьютер, ARM/macOS/Linux не проверены.

## Разработка и состав

Команды выполняются в «Не для установки». tools/distribution-paths.mjs задаёт соседнюю «Для установки». Упаковщик копирует явный список Electron runtime, locales, bundled main/preload/UI, минимальный package.json, READ-ME.ru.txt, READ-ME.en.txt, лицензии и инвентарь SHA-256. Production-зависимости уже внутри бандлов.

Исключены source/tests/node_modules, references/PDF, maps/logs/tmp/artifacts, Data и личные проекты/бэкапы. Git backup tags сохраняют историю исходников и не входят в ZIP. Инвентарь/хеш ZIP — проверка целостности, не подпись. Папка с Data или изменёнными файлами не заменяется пересборкой.

Если рабочая копия уже содержит Data, выберите отдельный output: $env:ALERT_STUDIO_RELEASE_DIR='Чистая сборка'. Упаковка, portable-тест и release tool используют эту подпапку внутри «Для установки»; выход за неё отклоняется. Переменная действует в текущем терминале. Локальная сборка с двумя отдельными RU/EN инструкциями не заменяет уже опубликованный архив 0.2.0, где инструкция общая двуязычная.

~~~powershell
pnpm install --frozen-lockfile
pnpm check
pnpm test:ui
pnpm package:portable
pnpm test:portable
~~~

test:portable распаковывает фактический ZIP, запускает EXE с PATH только Windows/System32 из постороннего cwd, блокирует DNS, проверяет Save/PNG/отдельное окно. Затем переносит тестовую копию на другой диск, делает старый путь недоступным и проверяет profile/layout/project/recovery/extension. По умолчанию E:; другой диск задаёт ALERT_STUDIO_TEST_DRIVE. Удаляется только собственная проверенная тестовая папка. Это не испытание на чистом другом ПК.

## Публикация по запросу

Обновите версию на ещё не опубликованную и обе release notes. После проверок сохраните исходники, создайте аннотированные version и уникальные backup tags, сохраните прежнюю вершину remote по [правилам](backups.md), выполните explicit atomic push и проверьте SHA. Затем node tools/github-release.mjs создаёт draft, загружает ZIP/SHA, проверяет размеры/хеши и публикует. Существующий Release не перезаписывается. Скрипт требует clean source, remote refs и portable-results для точного хеша ZIP. --inspect только читает доступ/выпуски. Credentials берутся из Git Credential Manager либо GH_TOKEN/GITHUB_TOKEN и не выводятся.
