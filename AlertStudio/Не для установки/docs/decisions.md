# Технические решения

[Русский](<decisions.md>) · [English](<en/decisions.md>) · [Оглавление](<README.md>)

Версии ниже взяты из локального package.json, а не из списка последних релизов: Electron 44.8.0, React/ReactDOM 19.3.1, Dockview React 8.5.1, Ajv 8.17.1, TypeScript 5.9.3, Vite 8.3.4, esbuild 0.28.2, Playwright 1.64.1. Дерево фиксирует pnpm-lock.yaml. Среда проверок: Node 24.19.0 и pnpm 11.25.0; минимальное требование сборки — Node 22.12+.

- TypeScript проверяет интерфейсы; Ajv проверяет внешние JSON и команды во время работы.
- React обслуживает панели, но не покадровую симуляцию. Electron предоставляет файлы и окна ценой крупной поставки.
- Dockview отвечает за размещение. Vite собирает UI; esbuild отдельно собирает main/preload и runtime-пакеты.
- Canvas2D уже рисует текст, туман, звёзды, сеть и оформление слоёв. Это действующий backend, а не только proof-of-concept text/rect. Сравнение с GPU ещё предстоит.
- Files использует неизменяемые ревизии, sync JSON и проверенный резервный индекс. Windows FolderLease держит OS named pipe: это локальная блокировка, не сетевой сервер.
- Переносимая сборка содержит собственный Electron и лицензионные тексты. node_modules и пользовательская Data не распространяются.

tools/package-portable.mjs собирает THIRD-PARTY-NOTICES.txt из production-зависимостей и сохраняет LICENSE/LICENSES.chromium.html Electron. Хеши проверяют целостность, а не доверие к издателю. Отдельного подписанного установщика и exporter на базе FFmpeg нет.

Решения проверяются кодом и [результатами тестов](verification.md). Автоматическое обновление всех зависимостей в этот процесс не входит.
