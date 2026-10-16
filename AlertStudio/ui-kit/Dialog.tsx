import { useEffect, useId, useRef, type ReactNode } from 'react';

export function Dialog({title, closeLabel, onClose, children}: {
  title: string; closeLabel: string; onClose: () => void; children: ReactNode;
}) {
  const titleId = useId();
  const element = useRef<HTMLElement>(null);
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const focusable = () => Array.from(element.current!.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex="0"]'));
    focusable()[0]?.focus();
    function key(event: KeyboardEvent) {
      if (event.key === 'Escape') { event.preventDefault(); close.current(); }
      if (event.key !== 'Tab') return;
      const items = focusable(), first = items[0], last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('keydown', key); previous?.focus(); };
  }, []);

  return <div className="modal-scrim">
    <section className="studio-dialog" ref={element} role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="dialog-heading"><h2 id={titleId}>{title}</h2><button className="quiet-button" onClick={onClose}>{closeLabel}</button></div>
      <div className="dialog-content">{children}</div>
    </section>
  </div>;
}
