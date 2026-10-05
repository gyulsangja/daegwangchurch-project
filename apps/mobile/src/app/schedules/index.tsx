import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { createEventClient } from '@daegwang/api-client/events';
import { MemberGate, useMemberSession } from '../../components/member-session';
import { AppScreen, MenuCard } from '../../components/app-screen';
import { Action, Card, Failure, colors, styles } from '../../components/ui';
import { DayCalendar } from '../../components/day-calendar';
import { useNoticeResource } from '../../hooks/use-notices';
import { collectPages } from '@daegwang/api-client/pagination';
import { eventOnDay, monthDates } from '@daegwang/contracts/features/calendar';
import { personalScheduleBounds } from '@daegwang/contracts/features/member/schedules';
import { koreaDate } from '../../hooks/use-latest-devotional';
import { eventDate } from '../../hooks/use-events';
const events = createEventClient(process.env.EXPO_PUBLIC_API_BASE_URL);
export default function Schedules() { return <MemberGate returnTo="/schedules"><ScheduleList /></MemberGate>; }
function ScheduleList() {
  const { schedules } = useMemberSession(); const [selected, setSelected] = useState(koreaDate); const [group, setGroup] = useState('all'); const [calendar, setCalendar] = useState(true);
  const month = selected.slice(0, 7);
  const personal = useNoticeResource(useCallback(async signal => ({ data: await collectPages((page, token) => schedules.list({ page, month }, token), signal), nextPage: null }), [schedules, month]));
  const church = useNoticeResource(useCallback(async signal => ({ data: await collectPages((page, token) => events.list(page, 'upcoming', token, undefined, month), signal), nextPage: null }), [month]));
  const savedById = new Map(personal.data?.data.filter(row => row.eventId && row.event && eventOnDay(row.event, selected)).map(row => [row.eventId!, row]));
  const churchById = new Map(church.data?.data.filter(event => eventOnDay(event, selected)).map(event => [event.id, event]));
  for (const saved of savedById.values()) if (saved.event && !churchById.has(saved.event.id)) churchById.set(saved.event.id, saved.event);
  const publicRows = group === 'personal' ? [] : [...churchById.values()].filter(event => group !== 'saved' || savedById.has(event.id));
  const privateRows = group === 'all' || group === 'personal' ? personal.data?.data.filter(row => row.content && eventOnDay({ startsAt: personalScheduleBounds(row.content).startsAt.toISOString(), endsAt: personalScheduleBounds(row.content).endsAt.toISOString(), isAllDay: false }, selected)) ?? [] : [];
  const marked = Object.fromEntries(monthDates(month).map(date => {
    const ids = new Set<string>();
    if (group === 'all' || group === 'church') for (const event of church.data?.data ?? []) if (eventOnDay(event, date)) ids.add('event:' + event.id);
    for (const row of personal.data?.data ?? []) {
      if (row.event && group !== 'personal' && eventOnDay(row.event, date)) ids.add('event:' + row.event.id);
      if (row.content && (group === 'all' || group === 'personal')) { const bounds = personalScheduleBounds(row.content); if (eventOnDay({ startsAt: bounds.startsAt.toISOString(), endsAt: bounds.endsAt.toISOString(), isAllDay: false }, date)) ids.add(row.id); }
    }
    return [date, ids.size];
  }));
  const loading = church.loading || personal.loading;
  return <AppScreen title="나의 일정" onBack={() => router.dismissTo('/my')}>
    {calendar && <DayCalendar selected={selected} onSelect={setSelected} marked={marked} />}<MenuCard title={calendar ? '목록 보기' : '캘린더로 보기'} description={selected} onPress={() => setCalendar(!calendar)} />
    <View accessibilityRole="tablist" accessibilityLabel="일정 종류" style={{ flexDirection: 'row', flexWrap: 'wrap', backgroundColor: colors.soft, borderRadius: 12, paddingHorizontal: 10 }}>{[['all', '전체'], ['church', '교회'], ['saved', '저장'], ['personal', '개인']].map(([value, title]) => <Pressable key={value} accessibilityRole="tab" aria-selected={group === value} accessibilityState={{ selected: group === value }} onPress={() => setGroup(value)} style={{ padding: 10, minHeight: 48 }}><Text style={group === value ? styles.title : styles.caption}>{title}</Text></Pressable>)}</View>
    {loading && <ActivityIndicator accessibilityLabel="일정을 불러오는 중" />}{!!church.error && group !== 'personal' && <Failure message={church.error} retry={church.reload} />}{!!personal.error && <Failure message={personal.error} retry={personal.reload} />}
    {publicRows.map(event => <MenuCard key={event.id} title={event.title} description={`교회${savedById.has(event.id) ? ' · 저장됨' : ''}\n${eventDate(event)}`} onPress={() => router.push({ pathname: '/events/[id]', params: { id: event.id } })} />)}
    {privateRows.map(row => <MenuCard key={row.id} title={row.content!.title} description={`개인 · ${row.content!.allDay ? '종일' : `${row.content!.startTime} ~ ${row.content!.endTime}`} · ${row.content!.location}`} onPress={() => router.push({ pathname: '/schedules/[id]', params: { id: row.id } })} />)}
    {!loading && !personal.error && (group === 'personal' || !church.error) && !publicRows.length && !privateRows.length && <Card title="등록된 일정이 없습니다">선택한 날짜에 일정이 없습니다.</Card>}
    {personal.data?.nextPage != null && <Action title="내 일정 더 보기" disabled={personal.loading} onPress={personal.reload} />}{church.data?.nextPage != null && group !== 'personal' && <Action title="교회 일정 더 보기" disabled={church.loading} onPress={church.reload} />}
    <Action title="개인 일정 등록" onPress={() => router.push({ pathname: '/schedules/new', params: { date: selected } })} />
  </AppScreen>;
}
