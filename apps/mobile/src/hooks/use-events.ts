import { useCallback } from 'react';
import { createEventClient, type ChurchEvent } from '@daegwang/api-client/events';
import { useNoticeResource } from './use-notices';
const client = createEventClient(process.env.EXPO_PUBLIC_API_BASE_URL);
export function useEventList(page: number, period: 'upcoming' | 'past') { return useNoticeResource(useCallback(signal => client.list(page, period, signal), [page, period])); }
export function useChurchEvent(id: string) { return useNoticeResource(useCallback(signal => client.detail(id, signal), [id])); }
export function eventDate(event: Pick<ChurchEvent, 'startsAt' | 'endsAt' | 'isAllDay'>) {
  const formatter = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit', ...(event.isAllDay ? {} : { hour: '2-digit', minute: '2-digit' }) });
  const start = formatter.format(new Date(event.startsAt));
  const end = event.endsAt ? formatter.format(new Date(event.endsAt)) : null;
  return `${start}${end && end !== start ? ` ~ ${end}` : ''}${event.isAllDay ? ' · 종일' : ' (한국 시간)'}`;
}
