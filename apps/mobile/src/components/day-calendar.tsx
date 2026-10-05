import { Pressable, Text, View } from 'react-native';
import { colors, styles } from './ui';
import { koreaDate } from '../hooks/use-latest-devotional';
export function DayCalendar({ selected, onSelect, marked = {}, label = '일정' }: { selected: string; onSelect: (date: string) => void; marked?: Record<string, number>; label?: string }) {
  const month = selected.slice(0, 7); const [year, m] = month.split('-').map(Number);
  const first = new Date(Date.UTC(year, m - 1, 1)).getUTCDay(); const days = new Date(Date.UTC(year, m, 0)).getUTCDate();
  const cells = Array.from({ length: Math.ceil((first + days) / 7) * 7 }, (_, index) => index - first + 1);
  function changeMonth(offset: number) { const date = new Date(Date.UTC(year, m - 1 + offset, 1)); if (date.getUTCFullYear() >= 1000 && date.getUTCFullYear() <= 9999) onSelect(date.toISOString().slice(0, 10)); }
  return <View style={[styles.card, { padding: 0, overflow: 'hidden', gap: 6 }]}>
    <View style={{ flexDirection: 'row', alignItems: 'center' }}><Pressable accessibilityRole="button" accessibilityLabel="이전 달" onPress={() => changeMonth(-1)} style={{ padding: 14, minHeight: 48 }}><Text style={styles.title}>‹</Text></Pressable><Text style={[styles.title, { flex: 1 }]}>{year}년 {m}월</Text><Pressable accessibilityRole="button" accessibilityLabel="다음 달" onPress={() => changeMonth(1)} style={{ padding: 14, minHeight: 48 }}><Text style={styles.title}>›</Text></Pressable></View>
    <Pressable accessibilityRole="button" accessibilityLabel="오늘로 이동" onPress={() => onSelect(koreaDate())} style={{ minHeight: 48, padding: 10 }}><Text style={styles.caption}>오늘로 이동</Text></Pressable>
    <View style={{ flexDirection: 'row' }}>{['일', '월', '화', '수', '목', '금', '토'].map(day => <Text key={day} style={[styles.caption, { width: `${100 / 7}%`, textAlign: 'center' }]}>{day}</Text>)}</View>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{cells.map((day, index) => { const date = `${month}-${String(day).padStart(2, '0')}`; const active = date === selected; return day < 1 || day > days ? <View key={index} style={{ width: `${100 / 7}%`, minHeight: 56 }} /> : <Pressable key={index} accessibilityRole="button" accessibilityLabel={`${date} ${label}${marked[date] ? ` ${marked[date]}개` : ''}`} aria-selected={active} accessibilityState={{ selected: active }} onPress={() => onSelect(date)} style={{ width: `${100 / 7}%`, minHeight: 56, paddingVertical: 6, justifyContent: 'center', alignItems: 'center', borderRadius: 12, borderWidth: date === koreaDate() ? 1 : 0, borderColor: colors.primary, backgroundColor: active ? colors.primary : colors.surface }}><Text style={[styles.title, { color: active ? 'white' : colors.text }]}>{day}</Text>{!!marked[date] && <Text style={[styles.caption, { fontSize: 11, lineHeight: 16, color: active ? 'white' : colors.muted }]}>{label}</Text>}</Pressable>; })}</View>
  </View>;
}
