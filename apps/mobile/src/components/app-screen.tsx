import { createContext, useContext, useState, type PropsWithChildren } from 'react';
import { Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Action, colors, styles } from './ui';

const NoticeContext = createContext<(title: string, message?: string) => void>(() => {});
export const useFeatureNotice = () => useContext(NoticeContext);

export function FeatureNoticeProvider({ children }: PropsWithChildren) {
  const [notice, setNotice] = useState<{ title: string; message: string } | null>(null);
  return <NoticeContext.Provider value={(title, message = '이 기능은 아직 준비 중입니다. 공개 콘텐츠와 연결된 개인 기능을 이용해 주세요.') => setNotice({ title, message })}>
    {children}
    <Modal visible={!!notice} transparent animationType="fade" onRequestClose={() => setNotice(null)}>
      <View style={screenStyles.overlay}>
        <View role="dialog" accessibilityLabel={notice?.title} aria-modal={true} accessibilityViewIsModal style={[screenStyles.dialog, { maxHeight: '90%', padding: 0 }]}><ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
          <Text accessibilityRole="header" style={styles.title}>{notice?.title}</Text>
          <Text style={screenStyles.message}>{notice?.message}</Text>
          <Action title="확인" onPress={() => setNotice(null)} />
        </ScrollView></View>
      </View>
    </Modal>
  </NoticeContext.Provider>;
}

export function AppScreen({ title, home = false, onBack, children }: PropsWithChildren<{ title: string; home?: boolean; onBack?: () => void }>) {
  return <SafeAreaView edges={['top', 'left', 'right']} style={styles.page}>
    <View style={[screenStyles.header, onBack && { paddingVertical: 12 }]}>
      {home && <Image source={require('../../assets/figma/church-mark.png')} style={screenStyles.logo} accessible={false} />}
      {onBack ? <Pressable accessibilityRole="button" accessibilityLabel="뒤로" onPress={onBack} style={{ flex: 1, minHeight: 48, justifyContent: 'center' }}><Text accessibilityRole="header" style={screenStyles.heading}>‹  {title}</Text></Pressable>
        : home ? <View accessible accessibilityRole="header" accessibilityLabel="대한예수교장로회 대광교회" style={{ flex: 1, gap: 1 }}><Text style={{ fontFamily: 'NotoSansKR_400Regular', color: colors.muted, fontSize: 11, lineHeight: 17 }}>대한예수교장로회</Text><Text style={[screenStyles.heading, { flex: 0, fontSize: 26, lineHeight: 35 }]}>대광교회</Text></View> : <Text accessibilityRole="header" style={screenStyles.heading}>{title}</Text>}
      {home && <Pressable accessibilityRole="button" accessibilityLabel="알림센터" onPress={() => router.push('/notifications')} style={screenStyles.notification}>
        <Text style={styles.caption}>알림</Text>
      </Pressable>}
    </View>
    {process.env.EXPO_PUBLIC_DEMO_MODE === 'true' && <Text style={[styles.caption, { textAlign: 'center', paddingHorizontal: 12, paddingBottom: 6 }]}>개발 체험 · 가상 정보만 입력{'\n'}실제 접수·발송 없음</Text>}
    <KeyboardAvoidingView style={styles.page} enabled={Platform.OS !== 'web'} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} style={styles.page} contentContainerStyle={[styles.body, home && screenStyles.homeBody]}>{children}</ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

export function MenuCard({ title, description, onPress }: { title: string; description?: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.65 }]}>
    <Text style={styles.title}>{title}  ›</Text>
    {description ? <Text style={styles.caption}>{description}</Text> : null}
  </Pressable>;
}

export function IntroCard({ title, children }: PropsWithChildren<{ title: string }>) {
  return <View style={[styles.card, screenStyles.intro]}><Text style={styles.title}>{title}</Text><Text style={styles.caption}>{children}</Text></View>;
}

export const screenStyles = StyleSheet.create({
  header: { width: '100%', maxWidth: 640, alignSelf: 'center', padding: 20, minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 12 },
  heading: { flex: 1, fontFamily: 'NotoSansKR_700Bold', fontSize: 22, lineHeight: 32, color: colors.text },
  brand: { fontSize: 20, lineHeight: 29 },
  logo: { width: 32, height: 38 },
  notification: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderRadius: 24 },
  homeBody: { gap: 16 },
  intro: { backgroundColor: colors.soft, gap: 8 },
  overlay: { flex: 1, backgroundColor: 'rgba(20,46,50,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  dialog: { width: '100%', maxWidth: 390, backgroundColor: colors.surface, borderRadius: 20, padding: 24, gap: 20 },
  message: { fontFamily: 'NotoSansKR_400Regular', fontSize: 16, lineHeight: 25, color: colors.text },
});
