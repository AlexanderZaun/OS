import type {CloseChoice,CloseState} from '../../contracts/close';
interface CloseActions {
  current():{dirty:boolean;name:string;folder:string|null};
  save():Promise<boolean>;
  finish(discard:boolean):Promise<void>;
  quit():void;
  changed(state:CloseState|null):void;
}
export class CloseCoordinator {
  private state:CloseState|null=null;
  private sequence=0;
  constructor(private actions:CloseActions){}
  snapshot(){return this.state?{...this.state}:null;}
  get pending(){return this.state!==null;}
  private update(patch:Partial<CloseState>){if(!this.state)return;this.state={...this.state,...patch};this.actions.changed(this.snapshot());}
  private clear(){this.state=null;this.actions.changed(null);}
  async request(){
    if(this.state)return;
    const current=this.actions.current();
    this.state={id:++this.sequence,phase:'confirm',name:current.name,folder:current.folder,error:null,detail:null};
    if(current.dirty)this.actions.changed(this.snapshot());else await this.finish(true);
  }
  async respond(id:number,choice:CloseChoice){
    if(!this.state||this.state.id!==id||this.state.phase!=='confirm'||!['save','discard','cancel'].includes(choice))throw Error('Invalid close response');
    if(choice==='cancel'){this.clear();return;}
    if(choice==='discard'){await this.finish(true);return;}
    this.update({phase:'saving',error:null,detail:null});
    try{
      if(!await this.actions.save()){this.update({phase:'confirm',error:'closeSaveCanceled'});return;}
    }catch(error){this.update({phase:'confirm',error:'closeSaveFailed',detail:String(error)});return;}
    await this.finish(true);
  }
  private async finish(discard:boolean){
    this.update({phase:'closing',error:null,detail:null});
    try{await this.actions.finish(discard);this.actions.quit();}
    catch(error){this.update({phase:'confirm',error:'closeDiscardFailed',detail:String(error)});}
  }
}
