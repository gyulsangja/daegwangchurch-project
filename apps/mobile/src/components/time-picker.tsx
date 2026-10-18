import { useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Action, colors, styles } from './ui';
import { screenStyles } from './app-screen';

const pad = (value: number) => String(value).padStart(2, '0');
export function displayTime(value: string) {
  const [hour, minute] = value.split(':').map(Number);
  return `${hour < 12 ? '오전' : '오후'} ${hour % 12 || 12}시 ${pad(minute)}분`;
}

function TimeColumn({ label, count, value, onChange }: { label: string; count: number; value: number; onChange: (value: number) => void }) {
  const scroll = useRef<ScrollView>(null);
  return <View style={{ flex: 1, gap: 8 }}>
    <Text style={styles.caption}>{label}</Text>
    <ScrollView ref={scroll} nestedScrollEnabled style={{ height: 200 }} onLayout={() => scroll.current?.scrollTo({ y: Math.max(0, value - 1) * 48, animated: false })}>
      {Array.from({ length: count }, (_, number) => <Pressable key={number} accessibilityRole="radio" accessibilityLabel={`${number}${label}`} accessibilityState={{ checked: value === number }} onPress={() => onChange(number)} style={{ height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: value === number ? colors.primary : colors.surface }}>
        <Text style={[styles.title, { color: value === number ? 'white' : colors.text }]}>{pad(number)}{label}</Text>
      </Pressable>)}
    </ScrollView>
  </View>;
}

export function TimePicker({ label, value, onChange, disabled = false }: { label: string; value: string; onChange: (value: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [hour, setHour] = useState(0); const [minute, setMinute] = useState(0);
  const close = () => setOpen(false);
  return <View style={{ gap: 8 }}>
    <Text style={styles.caption}>{label}</Text>
    <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${displayTime(value)}, 선택`} accessibilityState={{ disabled, expanded: open }} disabled={disabled} style={[styles.input, { minHeight: 48, justifyContent: 'center', opacity: disabled ? 0.5 : 1 }]} onPress={() => { const parts = value.split(':').map(Number); setHour(parts[0]); setMinute(parts[1]); setOpen(true); }}>
      <Text style={styles.title}>{displayTime(value)}  ▾</Text>
    </Pressable>
    <Modal visible={open && !disabled} transparent animationType="fade" onRequestClose={close}>
      <View style={screenStyles.overlay}><View role="dialog" aria-modal={true} accessibilityViewIsModal style={screenStyles.dialog}>
        <ScrollView contentContainerStyle={{ gap: 12 }}>
          <Text accessibilityRole="header" style={styles.title}>{label}</Text>
          <Text accessibilityLiveRegion="polite" style={styles.title}>{displayTime(`${pad(hour)}:${pad(minute)}`)}</Text>
          <Text style={styles.caption}>한국 시간 · 시와 분을 스크롤하여 선택하세요. 0시는 자정, 12시는 정오입니다.</Text>
          <View style={{ flexDirection: 'row', gap: 16 }}><TimeColumn label="시" count={24} value={hour} onChange={setHour} /><TimeColumn label="분" count={60} value={minute} onChange={setMinute} /></View>
          <Action title="선택한 시간 적용" onPress={() => { onChange(`${pad(hour)}:${pad(minute)}`); close(); }} />
          <Action secondary title="취소" onPress={close} />
        </ScrollView>
      </View></View>
    </Modal>
  </View>;
}
