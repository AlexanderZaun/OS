import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';

export interface MenuItem {id:string;label:string;action():void;disabled?:boolean;shortcut?:string;checked?:boolean;group?:string;}
export interface MenuDefinition {id:string;label:string;items:MenuItem[];}

/** Window-local command menu. Closing it restores focus before opening another UI. */
export function MenuBar({menus,label,disabled=false}:{menus:MenuDefinition[];label:string;disabled?:boolean}){
  const root=useRef<HTMLElement>(null),popup=useRef<HTMLDivElement>(null);
  const [open,setOpen]=useState<number|null>(null),[focusIndex,setFocusIndex]=useState(0);
  const [position,setPosition]=useState({left:0,top:0,maxHeight:400});
  const triggers=()=>Array.from(root.current?.querySelectorAll<HTMLButtonElement>('[data-menu-trigger]')??[]);
  function close(restore=false){setOpen(null);if(restore&&open!==null)triggers()[open]?.focus();}
  function focusItem(last=false){const items=popup.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');(last?items?.[items.length-1]:items?.[0])?.focus();}
  function show(index:number){setFocusIndex(index);setOpen(index);}
  useEffect(()=>{if(disabled)setOpen(null);},[disabled]);
  useEffect(()=>{
    function outside(e:PointerEvent){if(!root.current?.contains(e.target as Node)&&!popup.current?.contains(e.target as Node))setOpen(null);}
    function key(e:KeyboardEvent){if(e.key==='F10'&&!e.shiftKey&&!disabled&&!document.querySelector('[role="dialog"]')){e.preventDefault();triggers()[0]?.focus();setFocusIndex(0);}}
    function dismiss(){setOpen(null);}
    document.addEventListener('pointerdown',outside);document.addEventListener('keydown',key);window.addEventListener('blur',dismiss);
    return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',key);window.removeEventListener('blur',dismiss);};
  },[disabled]);
  useLayoutEffect(()=>{
    if(open===null)return;
    const place=()=>{const anchor=triggers()[open]?.getBoundingClientRect(),box=popup.current?.getBoundingClientRect();if(anchor&&box)setPosition({left:Math.max(8,Math.min(anchor.left,innerWidth-box.width-8)),top:anchor.bottom+3,maxHeight:Math.max(80,innerHeight-anchor.bottom-15)});};
    place();focusItem();window.addEventListener('resize',place);return()=>window.removeEventListener('resize',place);
  },[open]);
  return <>
    <nav ref={root} className="menu-bar" role="menubar" aria-label={label}>
      {menus.map((menu,i)=><button key={menu.id} id={`menu-trigger-${menu.id}`} data-menu-trigger role="menuitem" aria-haspopup="menu" aria-expanded={open===i}
        aria-controls={open===i?`menu-${menu.id}`:undefined} disabled={disabled} tabIndex={focusIndex===i?0:-1}
        onFocus={()=>setFocusIndex(i)} onClick={()=>open===i?close():show(i)} onPointerEnter={()=>{if(open!==null&&open!==i)show(i);}}
        onKeyDown={e=>{
          if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();const next=(i+(e.key==='ArrowRight'?1:-1)+menus.length)%menus.length;triggers()[next]?.focus();if(open!==null)show(next);}
          if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(open===i)focusItem(e.key==='ArrowUp');else show(i);}
          if(e.key==='Escape'){e.preventDefault();close(true);}
          if(e.key==='Tab')close();
        }}>{menu.label}</button>)}
    </nav>
    {open!==null&&createPortal(<div ref={popup} className="menu-popup" id={`menu-${menus[open].id}`} role="menu" aria-labelledby={`menu-trigger-${menus[open].id}`}
      style={position} onKeyDown={e=>{
        const items=Array.from(popup.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')??[]),index=items.indexOf(document.activeElement as HTMLButtonElement);
        if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();e.stopPropagation();const next=e.key==='Home'?0:e.key==='End'?items.length-1:(index+(e.key==='ArrowDown'?1:-1)+items.length)%items.length;items[next]?.focus();}
        if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();e.stopPropagation();show((open+(e.key==='ArrowRight'?1:-1)+menus.length)%menus.length);}
        if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close(true);}
        if(e.key==='Tab'){close(true);}
      }}>
      {menus[open].items.map((item,i,items)=><div key={item.id}>
        {item.group&&item.group!==items[i-1]?.group&&<div className="menu-group" role="presentation">{item.group}</div>}
        <button role={item.checked===undefined?'menuitem':'menuitemcheckbox'} aria-label={item.label} aria-checked={item.checked} disabled={item.disabled} tabIndex={-1}
          onClick={()=>{close(true);item.action();}}><span className="menu-check" aria-hidden="true">{item.checked?'✓':''}</span><span>{item.label}</span>{item.shortcut&&<kbd>{item.shortcut}</kbd>}</button>
      </div>)}
    </div>,document.body)}
  </>;
}
