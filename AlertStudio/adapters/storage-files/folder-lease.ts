import { createServer, type Server } from 'node:net';
import { promises as fs } from 'node:fs';
import { createHash } from 'node:crypto';

export class FolderBusyError extends Error {
  constructor() { super('projectBusy'); }
}

// Windows kernel owns the pipe handle. Process death releases it without a stale
// lock-file deletion race. No TCP port or application server is opened.
export class FolderLease {
  private constructor(readonly folder: string, private server: Server) {}

  static async acquire(folder: string): Promise<FolderLease> {
    if (process.platform !== 'win32') throw Error('folderLockUnsupported');
    const canonical = await fs.realpath(folder);
    const digest = createHash('sha256').update(canonical.toLowerCase()).digest('hex');
    const pipe = `\\\\.\\pipe\\alert-studio-project-${digest}`;
    const server = createServer(socket => socket.destroy());
    await new Promise<void>((resolve, reject) => {
      server.once('error', (error: NodeJS.ErrnoException) => {
        reject(error.code === 'EADDRINUSE' || error.code === 'EACCES' ? new FolderBusyError() : error);
      });
      server.listen({ path: pipe, exclusive: true }, resolve);
    });
    return new FolderLease(canonical, server);
  }

  async release(): Promise<void> {
    if (!this.server.listening) return;
    await new Promise<void>((resolve, reject) => this.server.close(error => error ? reject(error) : resolve()));
  }
}
