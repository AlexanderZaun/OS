export interface WindowAdapter { openPanel(type: string): Promise<void>; }
export interface WorkspaceAdapter { open(type: string): void; reset(): void; }
export interface ResourceService { resolve(id: string): Promise<Uint8Array>; }
export interface TranslationService { t(key: string): string; }
// Reserved contracts; no implementations claimed at this checkpoint.
export interface EncoderAdapter { encode(frames: AsyncIterable<Uint8Array>, signal: AbortSignal): Promise<string>; }
