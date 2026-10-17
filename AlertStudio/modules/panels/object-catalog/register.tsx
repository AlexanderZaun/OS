import type {PanelProps,UiHost} from '../../../sdk/ui';
import {ObjectCatalog} from './Catalog';
export function ObjectCatalogPanel(props:PanelProps){
  return <div className="panel-body object-catalog-panel"><ObjectCatalog {...props}/></div>;
}
export function register(host:UiHost){host.registerPanel({id:'objects',label:{ru:'Объекты',en:'Objects'},component:ObjectCatalogPanel});}
