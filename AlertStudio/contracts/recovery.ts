export interface RecoveryInfo {
  id: string;
  name: string;
  updatedAt: string;
  origin: string | null;
}
export interface SessionStatus {
  autosave: 'idle' | 'pending' | 'saving' | 'saved' | 'error';
  savedAt: string | null;
  error: string | null;
  folder: string | null;
  usedBackup: boolean;
  recovered: boolean;
}
