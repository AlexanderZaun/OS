import {useEffect,useRef,useState} from 'react';
import type {PlaybackSnapshot,PlaybackCommand} from '../../../contracts/playback';
export function usePlayback(){
  const [state,setState]=useState<PlaybackSnapshot>({time:0,playing:false,updatedAt:Date.now(),revision:-1,duration:48,loop:false,speed:1});
  const latest=useRef(state),[error,setError]=useState(false);
  useEffect(()=>{
    let active=true;
    const accept=(next:PlaybackSnapshot)=>{if(active&&next.revision>=latest.current.revision){latest.current=next;setState(next);}};
    const unsubscribe=window.studio.subscribePlayback(accept);void window.studio.playback().then(accept).catch(()=>{if(active)setError(true);});
    return()=>{active=false;unsubscribe();};
  },[]);
  function command(command:PlaybackCommand){setError(false);void window.studio.playbackCommand(command).catch(()=>setError(true));}
  return {state,latest,error,command};
}
