import type {Value} from '../../../contracts/project';
import type {Language} from '../../../sdk/ui';
import {translator} from '../../../locales/platform';
export function SettingHeading({id,label,unit,changed,baseline,disabled,reset,language}:{id:string;label:string;unit?:string;changed:boolean;baseline:Value;disabled?:boolean;reset():void;language:Language}){
  const t=translator(language);
  return <div className="setting-heading"><label htmlFor={id}>{label}{unit&&<small>{unit}</small>}{changed&&<span className="setting-modified" title={t('settingChanged')} aria-label={t('settingChanged')}>*</span>}</label>
    {changed&&<button type="button" className="setting-reset" aria-label={`${t('resetSetting')}: ${label}`} title={`${t('resetSetting')}: ${String(baseline)}`} disabled={disabled} onClick={reset}>↶</button>}
  </div>;
}
