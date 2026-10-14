'use client';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { Button } from '@daegwang/web-ui/components/ui/button';
export function AdminDialog({ title, trigger = '관리', children }: { title: ReactNode; trigger?: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false); const [discard, setDiscard] = useState(false); const [saved, setSaved] = useState(false); const dirty = useRef(new Set<HTMLFormElement>()); const body = useRef<HTMLDivElement>(null); const id = useId();
  useEffect(() => { const handler = (event: Event) => { const form = (event as CustomEvent<{ form: HTMLFormElement }>).detail?.form; if (form && body.current?.contains(form)) { dirty.current.delete(form); setSaved(true); } }; document.addEventListener('admin:saved', handler); return () => document.removeEventListener('admin:saved', handler); }, []);
  const close = () => { if (body.current?.querySelector('fieldset[disabled]')) return; if ([...dirty.current].some(form => form.isConnected)) setDiscard(true); else { dirty.current.clear(); setOpen(false); } };
  return <><Button variant="secondary" onClick={() => { setOpen(true); setSaved(false); }}>{trigger}</Button>
    <Dialog open={open} onClose={close} fullWidth maxWidth="md" aria-labelledby={id} scroll="paper"><DialogTitle id={id}>{title}</DialogTitle><DialogContent dividers><div ref={body} onChangeCapture={event => { const form = (event.target as HTMLElement).closest('form'); if (form) dirty.current.add(form); setSaved(false); }} className="space-y-5">{children}</div>{saved && <p role="status" className="mt-4 text-primary-700">저장했습니다. 다른 항목을 이어서 관리하거나 닫으세요.</p>}</DialogContent><DialogActions><Button variant="secondary" onClick={close}>닫기</Button></DialogActions></Dialog>
    <Dialog open={discard} onClose={() => setDiscard(false)} aria-labelledby={`${id}-discard`}><DialogTitle id={`${id}-discard`}>저장하지 않고 닫을까요?</DialogTitle><DialogActions><Button variant="secondary" onClick={() => setDiscard(false)}>계속 작성</Button><Button onClick={() => { dirty.current.clear(); setDiscard(false); setOpen(false); }}>저장하지 않고 닫기</Button></DialogActions></Dialog>
  </>;
}
