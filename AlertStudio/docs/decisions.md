# Решения и проверенные источники

Проверено 16.10.2026: Node 24.19.0 удовлетворяет Vite 8 требованиям 20.19+/22.12+. Зафиксированы Electron 44.8.0, Vite 8.3.4, React 19.3.1, Dockview React 8.5.1; peer range Dockview включает React 19. Ajv 8.17.1 выбран без автоматического обновления всех пакетов. pnpm-lock.yaml фиксирует дерево.

TypeScript — проверяемые интерфейсы при переносе JavaScript, но не JSON runtime validation и не гарантия скорости. Выбран 5.9.3 для стабильного compiler API проверки импортов; проба 7.0.2 показала отсутствие прежнего API в основном entrypoint. React — компонентные панели, не покадровая симуляция. Electron — файлы/окна ценой тяжёлой поставки. Dockview — готовое размещение; проверен реальным Electron UI-тестом. JSON Schema/Ajv — проверка внешних данных через заменяемый адаптер. Vite — сборка UI; runtime extensions собираются отдельно esbuild и грузятся динамически.

Canvas2D сейчас минимальный путь text/rect для доказательства SDK; основной путь сложного рендера ещё не выбран. Pixi/GPU сравнение запланировано до переноса большого набора эффектов. FFmpeg — будущий отдельный encoding adapter; сейчас не установлен, сборка и её лицензирование не выбраны.

Лицензии прямых зависимостей проверены по установленным package metadata: React/ReactDOM, Electron, Vite, Ajv, Dockview, esbuild — MIT; TypeScript и Playwright — Apache-2.0. Установщик и распространяемый license/notice bundle пока не подготовлены. Не называем стек безусловно лучшим.

Официальные документы: [Electron context isolation](https://www.electronjs.org/docs/latest/tutorial/context-isolation), [Electron protocol](https://www.electronjs.org/docs/latest/api/protocol), [Vite](https://vite.dev/guide/), [React versions](https://react.dev/versions), [Dockview quickstart](https://dockview.dev/docs/overview/quickstart/?framework=react), [Ajv](https://ajv.js.org/guide/getting-started.html), [TypeScript 5.9](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-9.html).
