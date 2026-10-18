import { FolderLease } from '../adapters/storage-files/folder-lease';
void FolderLease.acquire(process.argv[2]).then(lease => {
  process.send?.('ready');
  process.on('message', () => void lease.release().then(() => process.exit(0)));
}).catch(error => { console.error(String(error)); process.exit(2); });
