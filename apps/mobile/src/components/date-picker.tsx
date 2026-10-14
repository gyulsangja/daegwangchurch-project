import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Action, colors, styles } from './ui';
import { DayCalendar } from './day-calendar';
import { koreaDate } from '../hooks/use-latest-devotional';

export function MonthPicker({ label, value, onChange, clearable = true, disabled = false }: { label: string; value: string; onChange: (value: string) => void; clearable?: boolean; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(Number((value || koreaDate()).slice(0, 4)));
  return <View style={{ gap: 8 }}>
    <Text style={styles.caption}>{label}</Text>
    <Pressable accessibilityRole="button" accessibilityLabel={`${label} 선택`} accessibilityState={{ expanded: open, disabled }} disabled={disabled} style={[styles.input, { minHeight: 48, justifyContent: 'center' }]} onPress={() => { setYear(Number((value || koreaDate()).slice(0, 4))); setOpen(!open); }}><Text style={styles.title}>{value ? `${value.slice(0, 4)}년 ${Number(value.slice(5))}월` : '전체 기간'}  ▾</Text></Pressable>
    {open && !disabled && <View style={[styles.card, { padding: 12, gap: 10 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Pressable accessibilityRole="button" accessibilityLabel="이전 연도" disabled={year <= 1000} onPress={() => setYear(year - 1)} style={{ padding: 12, minHeight: 48 }}><Text style={styles.title}>‹</Text></Pressable><Text style={styles.title}>{year}년</Text><Pressable accessibilityRole="button" accessibilityLabel="다음 연도" disabled={year >= 9999} onPress={() => setYear(year + 1)} style={{ padding: 12, minHeight: 48 }}><Text style={styles.title}>›</Text></Pressable></View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{Array.from({ length: 12 }, (_, i) => i + 1).map(month => { const next = `${year}-${String(month).padStart(2, '0')}`; const selected = next === value; return <Pressable key={month} accessibilityRole="button" accessibilityLabel={`${year}년 ${month}월 선택`} accessibilityState={{ selected }} onPress={() => { onChange(next); setOpen(false); }} style={{ flexBasis: '30%', flexGrow: 1, minHeight: 48, borderRadius: 10, backgroundColor: selected ? colors.primary : colors.soft, justifyContent: 'center', alignItems: 'center' }}><Text style={[styles.title, { color: selected ? 'white' : colors.text }]}>{month}월</Text></Pressable>; })}</View>
      {clearable && <Action title="전체 기간 보기" secondary onPress={() => { onChange(''); setOpen(false); }} />}
      <Action title="선택 취소" secondary onPress={() => setOpen(false)} />
    </View>}
  </View>;
}

export function DatePicker({ label, value, onChange, optional = false, disabled = false }: { label: string; value: string; onChange: (value: string) => void; optional?: boolean; disabled?: boolean }) {
  const [open, setOpen] = useState(false); const [draft, setDraft] = useState(value || koreaDate());
  return <View style={{ gap: 8 }}><Text style={styles.caption}>{label}</Text>
    <Pressable accessibilityRole="button" accessibilityLabel={`${label} 선택`} accessibilityState={{ expanded: open, disabled }} disabled={disabled} style={[styles.input, { minHeight: 48, justifyContent: 'center' }]} onPress={() => { setDraft(value || koreaDate()); setOpen(!open); }}><Text style={styles.title}>{value ? `${value.slice(0, 4)}년 ${Number(value.slice(5, 7))}월 ${Number(value.slice(8))}일` : '날짜 선택'}  ▾</Text></Pressable>
    {open && !disabled && <View style={{ gap: 8 }}>
      <MonthPicker label="연·월 이동" value={draft.slice(0, 7)} onChange={month => setDraft(`${month}-01`)} clearable={false} />
      <DayCalendar selected={draft} onSelect={setDraft} label="선택" />
      <Action title="이 날짜 선택" onPress={() => { onChange(draft); setOpen(false); }} />
      {optional && <Action title="날짜 지정 안 함" secondary onPress={() => { onChange(''); setOpen(false); }} />}
      <Action title="선택 취소" secondary onPress={() => setOpen(false)} />
    </View>}
  </View>;
}
