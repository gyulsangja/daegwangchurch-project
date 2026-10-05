import { View } from 'react-native';
import { colors, styles } from './ui';
export function BulletinDocument({ url }: { url: string }) {
  return <View style={[styles.card, { backgroundColor: colors.soft, padding: 0, overflow: 'hidden' }]}>
    <iframe title="주보 문서" src={url} style={{ border: 0, width: '100%', height: 230 }} />
  </View>;
}
