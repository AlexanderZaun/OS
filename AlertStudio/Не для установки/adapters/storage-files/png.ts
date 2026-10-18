import {promises as fs} from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
export async function writePng(file:string,bytes:Uint8Array){
  const temporary=path.join(path.dirname(file),`.alertstudio-${randomUUID()}.png.tmp`);
  try{
    const handle=await fs.open(temporary,'wx');
    try{await handle.writeFile(bytes);await handle.sync();}finally{await handle.close();}
    await fs.rename(temporary,file);
  }finally{await fs.unlink(temporary).catch(error=>{if(error.code!=='ENOENT')throw error;});}
}
