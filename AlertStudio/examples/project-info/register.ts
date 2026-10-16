import type { UiHost, PanelProps } from '../../sdk/ui';
export function register(host:UiHost) {
  const R=host.React;
  function ProjectInfo({snapshot,language}:PanelProps) {
    return R.createElement('article',{style:{padding:24}},R.createElement('h2',null,language==='ru'?'Внешняя панель проекта':'External project panel'),
      R.createElement('p',null,language==='ru'?'Этот модуль установлен после сборки приложения.':'This module was installed after the app build.'),
      R.createElement('p',{'data-testid':'external-revision'},`${snapshot.project.name} · revision ${snapshot.revision} · ${snapshot.project.objects.length} objects`));
  }
  host.registerPanel({id:'project-info',label:{ru:'Информация о проекте',en:'Project information'},component:ProjectInfo});
}
