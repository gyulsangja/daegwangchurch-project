'use client';
import { useState } from 'react';
import type { OfferingAccount } from '@daegwang/contracts/features/church/offering';
import { Button } from '@daegwang/web-ui/components/ui/button';
export function OfferingAccountCard({ account }: { account: OfferingAccount }) {
  const [message, setMessage] = useState('');
  async function copy() { try { await navigator.clipboard.writeText(account.number.replace(/[\s-]/g, '')); setMessage('계좌번호를 복사했습니다.'); } catch { setMessage('복사하지 못했습니다. 계좌번호를 길게 누르거나 선택해 복사해 주세요.'); } }
  return <section className="rounded-2xl border border-border bg-white p-6 sm:p-8" aria-label="헌금 계좌">
    <p className="font-semibold text-primary-700">{account.bank}</p><p className="mt-3 select-all break-words text-2xl font-bold tracking-wide sm:text-3xl">{account.number}</p>
    <p className="mt-3 text-text-secondary">예금주 · {account.holder}</p><Button onClick={copy} className="mt-6">계좌번호 복사</Button>
    <p role="status" className="mt-3 text-sm text-primary-700">{message}</p>
    {account.note && <p className="mt-4 whitespace-pre-line text-sm leading-7 text-text-secondary">{account.note}</p>}
    <p className="mt-4 text-sm text-text-secondary">이체 전 은행과 예금주를 확인해 주세요.</p>
  </section>;
}
