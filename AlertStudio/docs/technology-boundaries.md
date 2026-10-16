# Границы технологий

React — только представления, UI SDK, bootstrap и Dockview-адаптер. Его замена требует переписать специальные React-панели; определения настроек и проект сохраняются. Electron — только desktop adapter и preload; замена потребует нового filesystem/window/IPC подключения. Dockview — только workspace adapter; компоненты панелей его не импортируют. Canvas API — только Canvas adapter; общая модель и эффект Orbit возвращают обычные данные.

Ajv — validation adapter. FFmpeg и Pixi пока не установлены и не реализованы. Их будущая замена не должна менять сохраняемую модель. Шейдеры нельзя обещать переносить без адаптации. Замена TypeScript существенно дороже замены отдельного адаптера.

`tools/check-boundaries.mjs` разбирает imports/exports compiler API TypeScript в core/contracts/sdk, запрещает framework и adapter imports (кроме явно UI-специфичного sdk/ui.ts). Проверка пока не является полным анализом транзитивных зависимостей или всех видов dynamic import; усилить до расширения ядра.
