export type CloseChoice='save'|'discard'|'cancel';
export interface CloseState {
  id:number;phase:'confirm'|'saving'|'closing';name:string;folder:string|null;
  error:'closeSaveCanceled'|'closeSaveFailed'|'closeDiscardFailed'|null;detail:string|null;
}
export type WindowCloseState=(CloseState&{owner:boolean})|null;
