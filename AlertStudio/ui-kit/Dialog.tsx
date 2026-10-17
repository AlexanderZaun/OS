import { useEffect, useId, useRef, type ReactNode } from 'react';

export function Dialog({title, closeLabel, onClose, children,closeDisabled=false}: {
  title: string; closeLabel: string; onClose: () => void; children: ReactNode;closeDisabled?:boolean;
}) {
  const titleId = useId();
  const element = useRef<HTMLElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  const disabled=useRef(closeDisabled);disabled.current=closeDisabled;

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const focusable = () => Array.from(element.current!.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex="0"]'));
    focusable()[0]?.focus();
    function key(event: KeyboardEvent) {
      if (event.key === 'Escape') { event.preventDefault(); if(!disabled.current)close.current(); }
      if (event.key !== 'Tab') return;
      const items = focusable(), first = items[0], last = items.at(-1);
      if(!items.length){event.preventDefault();element.current?.focus();return;}
      if(document.activeElement===element.current){event.preventDefault();(event.shiftKey?last:first)?.focus();return;}
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('keydown', key); previous?.focus(); };
  }, []);
  useEffect(()=>{if(closeDisabled)element.current?.focus();},[closeDisabled]);

  return <div className="modal-scrim">
    <section className="studio-dialog" ref={element} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="dialog-heading"><h2 id={titleId}>{title}</h2><button className="quiet-button" disabled={closeDisabled} onClick={onClose}>{closeLabel}</button></div>
      <div className="dialog-content">{children}</div>
    </section>
  </div>;
}
