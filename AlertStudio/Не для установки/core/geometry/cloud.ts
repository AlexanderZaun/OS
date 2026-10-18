export function cloudRadius(shape:string,angle:number,roughness=.65):number {
  if(shape==='rounded')return (Math.abs(Math.cos(angle))**4+Math.abs(Math.sin(angle))**4)**(-.25);
  if(shape==='cloud')return Math.max(.65,Math.min(.98,.88+roughness*(.07*Math.sin(3*angle+.6)+.04*Math.cos(5*angle)+.025*Math.sin(9*angle+1))));
  return 1;
}
export function toWorld(x:number,y:number,cx:number,cy:number,rotation:number){const c=Math.cos(rotation),s=Math.sin(rotation);return {x:cx+x*c-y*s,y:cy+x*s+y*c};}
