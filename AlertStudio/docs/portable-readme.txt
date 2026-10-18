AlertStudio — переносимая версия / Portable edition

Windows 10/11 x64.

1. Полностью распакуйте ZIP в папку, доступную для записи.
2. Запустите AlertStudio.exe. Node.js, pnpm, установщик и интернет для работы не нужны.
3. При первом запуске программа создаст Data рядом с EXE.
4. Первое «Сохранить» записывает новый проект в Data/Projects. «Сохранить как» позволяет выбрать другое место.
5. Для переноса закройте программу и перенесите ВСЮ папку, включая Data, а не один EXE.

Data/Profile — настройки интерфейса и браузерные данные.
Data/Projects — проекты, сохранённые по умолчанию.
Data/Recovery — черновики восстановления, отдельно от сохранённых проектов.
Data/Extensions — установленные расширения.
Data/Logs и Data/CrashDumps — диагностические данные.

Файлы, которые вы сохраняете за пределами этой папки, переносите самостоятельно.
Не запускайте программу прямо из ZIP. Не удаляйте DLL, locales или resources.
Новая сборка не содержит чужих проектов, черновиков или настроек.
Для обновления используйте новую папку сборки и перенесите в неё свою Data при закрытой программе.
Сборка не имеет отдельной коммерческой подписи издателя; Windows может показать предупреждение при скачивании.

Extract the complete ZIP to a writable folder and run AlertStudio.exe.
No Node.js, pnpm, installer or network connection is required for normal operation.
Close the app before moving the ENTIRE folder, including Data, to another path or drive.
The first Save creates a project under Data/Projects. Save As can use an external folder.
Files saved outside the portable folder must be transferred separately.
For updates, extract a fresh version and move your Data into it while both apps are closed.
Do not run from inside the ZIP and do not remove runtime libraries/resources.
This build has no separate commercial publisher signature; Windows may show a download warning.
