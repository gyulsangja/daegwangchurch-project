import { Pressable, Switch, Text, TextInput, View, type TextInputProps } from 'react-native';
import { styles, colors } from './ui';
export function FormField({ label, ...props }: TextInputProps & { label: string }) {
  return <View style={{ gap: 6 }}><Text style={styles.caption}>{label}</Text><TextInput accessibilityLabel={label} autoCorrect={false} {...props} style={[styles.input, props.multiline && { minHeight: 132, textAlignVertical: 'top' }, props.style]} /></View>;
}
export function Check({ label, value, onChange, disabled = false }: { label: string; value: boolean; onChange: (value: boolean) => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="checkbox" accessibilityLabel={label} aria-checked={value} aria-disabled={disabled} accessibilityState={{ checked: value, disabled }} disabled={disabled} onPress={() => onChange(!value)} style={styles.card}><Text style={styles.title}>{value ? '☑' : '☐'} {label}</Text></Pressable>;
}
export function Toggle({ label, value, onChange, disabled = false }: { label: string; value: boolean; onChange: (value: boolean) => void; disabled?: boolean }) {
  return <View style={[styles.card, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }]}><Text style={[styles.title, { flex: 1 }]}>{label}</Text><Text style={styles.caption}>{value ? '켜짐' : '꺼짐'}</Text><Switch accessibilityLabel={label} value={value} onValueChange={onChange} disabled={disabled} trackColor={{ false: colors.muted, true: colors.primary }} ios_backgroundColor={colors.muted} /></View>;
}
export function Choice({ label, value, options, onChange }: { label: string; value: string; options: [string, string][]; onChange: (value: string) => void }) {
  return <View style={{ gap: 6 }}><Text style={styles.caption}>{label}</Text><View accessibilityRole="radiogroup" accessibilityLabel={label} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{options.map(([key, title]) => <Pressable key={key} accessibilityRole="radio" accessibilityLabel={title} aria-checked={key === value} accessibilityState={{ checked: key === value }} onPress={() => onChange(key)} style={[styles.card, { backgroundColor: value === key ? colors.soft : colors.surface, justifyContent: 'center' }]}><Text style={styles.title}>{title}</Text></Pressable>)}</View></View>;
}
