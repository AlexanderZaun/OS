import type { Language } from '../sdk/ui';
const en={new:'New project',open:'Open',save:'Save',saveAs:'Save as',undo:'Undo',redo:'Redo',extensions:'Extensions',install:'Install package folder',folder:'Open extensions folder',restart:'Installed. Restart the app to activate.',close:'Close',add:'Add object',duplicate:'Duplicate',remove:'Remove',visibility:'Visible',base:'Base settings',scene:'Scene',empty:'Select an object to edit its settings.',missing:'Required effect is unavailable. Data is preserved.',detach:'Open in separate window',reset:'Reset workspace',play:'Play',pause:'Pause',fit:'Fit',welcome:'Create your next moment.',intro:'An offline workspace for stream graphics',create:'Create project',name:'Project name',width:'Width',height:'Height',background:'Background',transparent:'Transparent',trusted:'Install trusted ready packages only. Extensions run code in the editor. Activation requires restart.',safe:'Safe launch: pnpm start -- --safe',panel:'Open panel',dirty:'Unsaved',clean:'Saved',check:'Experimental SDK 0.1 · Canvas 2D',return:'Close this window to return to the main workspace.'};
const ru:typeof en={new:'Новый проект',open:'Открыть',save:'Сохранить',saveAs:'Сохранить как',undo:'Отменить',redo:'Повторить',extensions:'Расширения',install:'Установить папку пакета',folder:'Папка расширений',restart:'Установлено. Перезапустите приложение для активации.',close:'Закрыть',add:'Добавить объект',duplicate:'Дублировать',remove:'Удалить',visibility:'Видимость',base:'Базовые настройки',scene:'Сцена',empty:'Выберите объект для изменения его настроек.',missing:'Нужный эффект недоступен. Данные сохранены.',detach:'Открыть в отдельном окне',reset:'Сбросить рабочую область',play:'Воспроизвести',pause:'Пауза',fit:'Вписать',welcome:'Создайте следующий яркий момент.',intro:'Офлайн-редактор графики для стримов',create:'Создать проект',name:'Название проекта',width:'Ширина',height:'Высота',background:'Фон',transparent:'Прозрачный',trusted:'Устанавливайте только доверенные готовые пакеты. Расширения исполняют код в редакторе. Активация после перезапуска.',safe:'Безопасный запуск: pnpm start -- --safe',panel:'Открыть панель',dirty:'Не сохранено',clean:'Сохранено',check:'Экспериментальный SDK 0.1 · Canvas 2D',return:'Закройте это окно для возврата в основную рабочую область.'};
const sessionEn = {
  recovery:'Recovery drafts', recoveryIntro:'Drafts are kept separately from your saved projects. Restore opens an unsaved copy.',
  restore:'Restore draft', dismiss:'Dismiss', noDrafts:'No recovery drafts available.',
  recoveredNotice:'A recovery draft is open. Save it to a project folder when ready.',
  backupNotice:'The main project index was damaged. The previous saved version is open; review it before saving.',
  autosaveIdle:'Draft: no pending edits', autosavePending:'Draft: waiting', autosaveSaving:'Saving draft…',
  autosaveSaved:'Draft saved', autosaveError:'Draft could not be saved', unsavedProject:'Unsaved project',
  projectBusy:'This project folder is already open in another AlertStudio process. Close it there before opening it here.',
  projectUnreadable:'The project and its backup could not be read. Select another folder or restore a recovery draft.',
  projectOperationBusy:'A project operation is still in progress. Please wait.',
  folderLockUnsupported:'Project folder locking is currently supported on Windows only.',
  projectFolderContainsOtherProject:'This folder contains another project. Choose an empty folder for Save as.',
  time:'Time (seconds)', emptyLayersTitle:'Your scene is empty', emptyLayersHint:'Add an object using the tools on the left.',
  check:'Local project · offline', resume:'Continue editing', savedFolder:'Project folder',
};
const sessionRu:typeof sessionEn = {
  recovery:'Черновики восстановления', recoveryIntro:'Черновики хранятся отдельно от сохранённых проектов. Восстановление открывает несохранённую копию.',
  restore:'Восстановить черновик', dismiss:'Скрыть', noDrafts:'Черновиков для восстановления нет.',
  recoveredNotice:'Открыт восстановленный черновик. Когда будете готовы, сохраните его в папку проекта.',
  backupNotice:'Основной индекс проекта повреждён. Открыта предыдущая сохранённая версия; проверьте её перед сохранением.',
  autosaveIdle:'Черновик: нет новых правок', autosavePending:'Черновик: ожидание', autosaveSaving:'Сохранение черновика…',
  autosaveSaved:'Черновик сохранён', autosaveError:'Черновик не сохранён', unsavedProject:'Несохранённый проект',
  projectBusy:'Эта папка проекта уже открыта в другом процессе AlertStudio. Сначала закройте проект там.',
  projectUnreadable:'Не удалось прочитать проект и резервный индекс. Выберите другую папку или восстановите черновик.',
  projectOperationBusy:'Операция с проектом ещё выполняется. Подождите.',
  folderLockUnsupported:'Блокировка папки проекта пока поддерживается только в Windows.',
  projectFolderContainsOtherProject:'В этой папке находится другой проект. Для «Сохранить как» выберите пустую папку.',
  time:'Время (секунды)', emptyLayersTitle:'Сцена пока пуста', emptyLayersHint:'Добавьте объект с помощью инструментов слева.',
  check:'Локальный проект · офлайн', resume:'Продолжить редактирование', savedFolder:'Папка проекта',
};
const dictionaries = {en:{...en,...sessionEn},ru:{...ru,...sessionRu}};
export type TranslationKey = keyof typeof dictionaries.en;
export function translator(language:Language){return (key:TranslationKey)=>{const found=dictionaries[language][key];if(!found)console.warn('Missing translation',language,key);return found??dictionaries.en[key]??key;};}
