export const blendModes=['normal','multiply','screen','overlay','darken','lighten','color-dodge','color-burn','hard-light','soft-light','difference','exclusion','add'] as const;
export interface LayerStyle {version:1;blend:typeof blendModes[number];clip:boolean;hue:number;saturation:number;opacity:number;}
export type LayerKey=Exclude<keyof LayerStyle,'version'>;
