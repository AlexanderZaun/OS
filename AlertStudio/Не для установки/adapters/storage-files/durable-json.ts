import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export async function writeJson(file: string, data: unknown): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const handle = await fs.open(file, 'w');
  try {
    await handle.writeFile(JSON.stringify(data, null, 2), 'utf8');
    await handle.sync();
  } finally {
    await handle.close();
  }
}

export async function replaceJson(file: string, data: unknown): Promise<void> {
  const temporary = `${file}.${randomUUID()}.tmp`;
  await writeJson(temporary, data);
  await fs.rename(temporary, file);
}
