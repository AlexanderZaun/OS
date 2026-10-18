import type {Command,Value} from './project';
import type {LayerStyle} from './layer';
export interface CopiedSettings {projectId:string;name:string;type:string;version:string;values:Record<string,Value>|null;appearance?:LayerStyle;}
export interface HistoryEntry {id:number;action:Command['type'];name?:string;objectType?:string;key?:string;scope?:'effect'|'layer';time:number;}
export interface HistorySnapshot {past:HistoryEntry[];future:HistoryEntry[];limit:number;}
