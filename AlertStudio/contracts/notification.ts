export type NotificationWorkspace='main'|'intro'|'outro'|'assembly';
export interface NotificationSettings {version:1;introDuration:number;holdDuration:number;outroDuration:number;introFade:boolean;outroFade:boolean;}
export type NotificationKey=Exclude<keyof NotificationSettings,'version'>;
