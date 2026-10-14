'use client';
import Link from 'next/link';
import { Save, LoaderCircle } from 'lucide-react';
import { Button } from '@daegwang/web-ui/components/ui/button';
export function EditorActions({ pending, href }: { pending: boolean; href: string }) {
  return <div className="sticky bottom-0 z-20 flex flex-wrap justify-end gap-2 rounded-xl border border-border bg-white p-3 shadow-sm lg:col-span-2">
    <Button asChild variant="secondary"><Link href={href}>목록으로</Link></Button>
    <Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}{pending ? '저장 중…' : '저장'}</Button>
  </div>;
}
