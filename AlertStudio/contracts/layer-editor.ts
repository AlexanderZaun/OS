export const layerTags=['none','red','orange','yellow','green','blue','purple'] as const;
export interface LayerEditor {version:1;locked:boolean;solo:boolean;tag:typeof layerTags[number];}
export type LayerEditorKey=Exclude<keyof LayerEditor,'version'>;
