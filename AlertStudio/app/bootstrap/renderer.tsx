import { createRoot } from 'react-dom/client';
import { Registry } from './registry';
import { register as text } from '../../modules/effects/text/src/register';
import { register as fog } from '../../modules/effects/fog/src/register';
import { register as stars } from '../../modules/effects/stars/src/register';
import { register as network } from '../../modules/effects/network/src/register';
import { register as layers } from '../../modules/panels/layers/register';
import { register as properties } from '../../modules/panels/properties/register';
import { register as canvas } from '../../modules/panels/canvas/register';
import { Shell } from '../shell/Shell';
import '../shell/style.css';
async function bootstrap(){const registry=new Registry();for(const register of [text,fog,stars,network,layers,properties,canvas])registry.add({register});await registry.external();const snapshot=await window.studio.snapshot();createRoot(document.getElementById('root')!).render(<Shell registry={registry} initial={snapshot}/>);addEventListener('unload',()=>registry.shutdown());}
void bootstrap().catch(error=>{document.getElementById('root')!.textContent=String(error);});
