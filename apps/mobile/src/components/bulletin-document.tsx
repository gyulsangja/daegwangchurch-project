import { Text, View } from 'react-native';
import { colors, styles } from './ui';
export function BulletinDocument({ url: _url }: { url: string }) {
  return <View style={[styles.card, { backgroundColor: colors.soft, minHeight: 230, justifyContent: 'center', alignItems: 'center', gap: 10 }]}>
    <Text style={styles.title}>주보 문서</Text><Text style={styles.caption}>아래 원본 열기로 문서 뷰어에서 확인하세요.</Text>
  </View>;
}
