export async function menuCommand(page,section,label){
  await page.locator(`#menu-trigger-${section}`).click();
  await page.getByRole('menu').getByRole('menuitem',{name:label,exact:true}).click();
}
export async function appCommand(page,label){
  if(label==='RU'||label==='EN'){
    const button=page.getByRole('button',{name:label,exact:true});
    if(await button.count()){await button.click();return;}
    await page.locator('#menu-trigger-edit').click();
    await page.getByRole('menuitemcheckbox',{name:label==='RU'?'English':'Русский',exact:true}).click();return;
  }
  const section=['Отменить','Повторить','Расширения'].includes(label)?'edit':['Панели','Panels','Сбросить рабочую область'].includes(label)?'window':'file';
  await menuCommand(page,section,label);
}
export async function ensurePanelManager(page){
  await menuCommand(page,'window','Панели');
}
