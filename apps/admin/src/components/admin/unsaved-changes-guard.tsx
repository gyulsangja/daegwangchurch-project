'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
const message = '저장하지 않은 변경사항이 있습니다. 페이지를 이동하시겠습니까?';
const formSelector = 'form[data-unsaved-warning], form[class*="lg:grid-cols"]';
export function UnsavedChangesGuard() {
  const pathname = usePathname();
  useEffect(() => {
    const dirtyForms = new Set<Element>();
    const dirty = () => [...dirtyForms].some(form => form.isConnected);
    const change = (event: Event) => { const form = (event.target as HTMLElement).closest(formSelector); if (form) dirtyForms.add(form); };
    const saved = (event: Event) => { const form = (event as CustomEvent<{ form?: HTMLFormElement }>).detail?.form; if (form) dirtyForms.delete(form); else dirtyForms.clear(); };
    const beforeUnload = (event: BeforeUnloadEvent) => { if (!dirty()) return; event.preventDefault(); event.returnValue = ''; };
    const click = (event: MouseEvent) => { if (!dirty()) return; const anchor = (event.target as HTMLElement).closest('a[href]') as HTMLAnchorElement | null; if (!anchor || anchor.target === '_blank' || anchor.href === window.location.href) return; if (!window.confirm(message)) { event.preventDefault(); event.stopPropagation(); } else dirtyForms.clear(); };
    // A submission may fail. Only a confirmed successful save or navigation clears the warning.
    document.addEventListener('input', change); document.addEventListener('change', change); document.addEventListener('admin:saved', saved); document.addEventListener('click', click, true); window.addEventListener('beforeunload', beforeUnload);
    return () => { document.removeEventListener('input', change); document.removeEventListener('change', change); document.removeEventListener('admin:saved', saved); document.removeEventListener('click', click, true); window.removeEventListener('beforeunload', beforeUnload); };
  }, [pathname]);
  return null;
}
