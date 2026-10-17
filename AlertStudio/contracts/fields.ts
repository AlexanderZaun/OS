export interface CloudBillow {x:number;y:number;radius:number;weight:number;baseX?:number;baseY?:number;baseRadius?:number;vx?:number;vy?:number;}
export interface CloudField {shape:string;roughness?:number;billows:CloudBillow[];rotation:number;edge?:number;opening?:number;openingWidth?:number;openingHeight?:number;billowStretch?:number;billowAngle?:number;}
export interface StarPoint {id?:number;x:number;y:number;baseX?:number;baseY?:number;radius:number;alpha:number;color:number;sparkle:boolean;center?:boolean;trailX?:number;trailY?:number;glint?:number;densityAlpha?:number;}
export interface StarCloud {offsetX:number;offsetY:number;width:number;height:number;field:CloudField;}
export interface StarField {rotation:number;stars:StarPoint[];clip?:string;cloud?:StarCloud;}
