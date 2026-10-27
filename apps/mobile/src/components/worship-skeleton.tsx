import {DataLoading} from './data-loading';
import { View } from 'react-native';
import { colors } from './ui';
export function WorshipSkeleton({ card = false }: { card?: boolean }) {
  return <View accessible accessibilityLabel="말씀을 준비하고 있습니다" style={{ gap: 12, minHeight: card ? 235 : 62, padding: card ? 14 : 0, borderRadius: 16, backgroundColor: card ? colors.surface : 'transparent' }}>
    <DataLoading label="말씀을 불러오는 중" compact/>
    {card && <View style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: 12, backgroundColor: colors.line }} />}
    <View style={{ height: 20, width: '84%', borderRadius: 6, backgroundColor: colors.line }} /><View style={{ height: 16, width: '55%', borderRadius: 6, backgroundColor: colors.line }} />
  </View>;
}
