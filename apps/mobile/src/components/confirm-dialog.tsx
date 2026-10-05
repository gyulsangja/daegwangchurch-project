import { Modal, ScrollView, Text, View } from 'react-native';
import { Action, styles } from './ui';
import { screenStyles } from './app-screen';
export function ConfirmDialog({ visible, title, message, confirmLabel, onConfirm, onCancel, busy = false }: { visible: boolean; title: string; message: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void; busy?: boolean }) {
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={() => { if (!busy) onCancel(); }}><View style={screenStyles.overlay}><View role="dialog" accessibilityLabel={title} aria-modal={true} accessibilityViewIsModal style={[screenStyles.dialog, { maxHeight: '90%', padding: 0 }]}><ScrollView contentContainerStyle={{ padding: 24, gap: 20 }} keyboardShouldPersistTaps="handled"><Text accessibilityRole="header" style={styles.title}>{title}</Text><Text style={styles.caption}>{message}</Text><Action title={confirmLabel} disabled={busy} onPress={onConfirm} /><Action secondary title="취소" disabled={busy} onPress={onCancel} /></ScrollView></View></View></Modal>;
}
