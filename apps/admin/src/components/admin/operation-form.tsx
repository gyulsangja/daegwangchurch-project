'use client';
import { useActionState, useEffect, useRef, type ReactNode } from 'react';
import { Button } from '@daegwang/web-ui/components/ui/button';
type State = { message: string; ok: boolean };
export function OperationForm({ action, children, submit }: { action: (state: State, form: FormData) => Promise<State>; children: ReactNode; submit: string }) {
  const [state, formAction, pending] = useActionState(action, { message: '', ok: false });
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.ok) { form.current?.reset(); document.dispatchEvent(new CustomEvent('admin:saved', { detail: { form: form.current } })); } }, [state]);
  return <form ref={form} action={formAction} data-unsaved-warning className="space-y-4 rounded-2xl border border-border bg-white p-5 [&_input]:min-h-11 [&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:border-border [&_input]:p-2 [&_select]:min-h-11 [&_select]:w-full [&_select]:rounded-lg [&_select]:border [&_select]:border-border [&_select]:p-2 [&_textarea]:w-full [&_textarea]:rounded-lg [&_textarea]:border [&_textarea]:border-border [&_textarea]:p-2">
    <fieldset disabled={pending} className="space-y-4">{children}<Button type="submit" disabled={pending}>{pending ? '저장 중…' : submit}</Button></fieldset>
    {state.message && <p role={state.ok ? 'status' : 'alert'} className={state.ok ? 'text-primary-700' : 'text-red-700'}>{state.message}</p>}
  </form>;
}
