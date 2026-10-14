import { useState, type ReactNode } from 'react';
import { Linking, Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { colors, styles } from './ui';

export function BulletinFrame({ url, render }: { url: string; render: (fullScreen: boolean) => ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  const [openError, setOpenError] = useState(false);
  return <>
    <Pressable accessibilityRole="button" accessibilityLabel="주보 전체 화면 보기" onPress={() => setExpanded(true)} style={[styles.card, { minHeight: 48, padding: 12, alignItems: 'center' }]}><Text style={styles.title}>⛶ 전체 화면으로 보기</Text></Pressable>
    <View style={{ height: 540, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.soft }}>{!expanded && render(false)}</View>
    <Modal visible={expanded} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setExpanded(false)} supportedOrientations={['portrait', 'landscape']}>
      <SafeAreaProvider><SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}><View role="dialog" accessibilityLabel="주보 전체 화면" accessibilityViewIsModal aria-modal style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.soft }}><Text style={[styles.title, { flex: 1 }]}>주보</Text><Pressable accessibilityRole="button" accessibilityLabel="주보 전체 화면 닫기" onPress={() => setExpanded(false)} style={{ minHeight: 52, minWidth: 64, alignItems: 'center', justifyContent: 'center' }}><Text style={[styles.title, { color: colors.primary }]}>닫기 ✕</Text></Pressable></View>
        <View style={{ flex: 1, minHeight: 0 }}>{expanded && render(true)}</View>
        <Pressable accessibilityRole="link" onPress={() => { setOpenError(false); void Linking.openURL(url).catch(() => setOpenError(true)); }} style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: colors.primary }}>주보 원본 열기 ↗</Text></Pressable>
        {openError && <Text accessibilityRole="alert" style={{ textAlign: 'center', padding: 8 }}>원본을 열지 못했어요. 잠시 후 다시 눌러 주세요.</Text>}
      </View></SafeAreaView></SafeAreaProvider>
    </Modal>
  </>;
}
