import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { PropsWithChildren } from 'react';

import { mobileColors as colors } from '@daegwang/design-tokens';
export { colors };
export const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  body: { padding: 20, gap: 14, paddingBottom: 40, width: '100%', maxWidth: 640, alignSelf: 'center' },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 20, padding: 14, gap: 4, minHeight: 56 },
  title: { fontFamily: 'NotoSansKR_700Bold', fontSize: 16, lineHeight: 24, color: colors.text },
  caption: { fontFamily: 'NotoSansKR_400Regular', fontSize: 14, lineHeight: 21, color: colors.muted },
  button: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, minHeight: 54, justifyContent: 'center' },
  buttonText: { fontFamily: 'NotoSansKR_700Bold', fontSize: 16, lineHeight: 24, color: 'white', textAlign: 'center' },
  input: { fontFamily: 'NotoSansKR_400Regular', fontSize: 16, lineHeight: 24, borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 12, minHeight: 52, backgroundColor: 'white', color: colors.text },
});
export function Card({ title, children }: PropsWithChildren<{ title: string }>) {
  return <View style={styles.card}><Text style={styles.title}>{title}</Text>{children === undefined || children === null || children === false || children === '' ? null : <Text selectable style={[styles.caption, { fontSize: 16, lineHeight: 26 }]}>{children}</Text>}</View>;
}
export function Action({ title, onPress, disabled = false, secondary = false }: { title: string; onPress: () => void; disabled?: boolean; secondary?: boolean }) {
  return <Pressable accessibilityRole="button" aria-disabled={disabled} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, secondary && { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line }, { opacity: disabled || pressed ? 0.65 : 1 }]}><Text style={[styles.buttonText, secondary && { color: colors.primary }]}>{title}</Text></Pressable>;
}
export function Loading() { return <View style={styles.card}><ActivityIndicator color={colors.primary} accessibilityLabel="말씀을 불러오는 중" /><Text style={styles.caption}>말씀을 불러오고 있습니다.</Text></View>; }
export function Failure({ message, retry }: { message: string; retry: () => void }) {
  return <View style={styles.card}><Text accessibilityRole="alert" style={styles.caption}>{message}</Text><Action title="다시 시도" onPress={retry} /></View>;
}
