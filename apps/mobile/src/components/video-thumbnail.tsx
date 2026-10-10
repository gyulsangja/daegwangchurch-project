import { useState } from 'react';
import { Image, Text, View } from 'react-native';
import { colors, styles } from './ui';

export function VideoThumbnail({ videoId }: { videoId: string }) {
  const [failedId, setFailedId] = useState<string>();
  return <View style={{ width: '100%', aspectRatio: 16 / 9, backgroundColor: colors.video, borderRadius: 12, overflow: 'hidden', justifyContent: 'center' }}>
    {failedId === videoId ? <Text style={[styles.caption, { color: 'white', textAlign: 'center' }]}>영상 미리보기를 불러오지 못했습니다</Text>
      : <Image accessibilityLabel="말씀 영상 썸네일" source={{ uri: `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/mqdefault.jpg` }} resizeMode="contain" style={{ width: '100%', height: '100%' }} onError={() => setFailedId(videoId)} />}
  </View>;
}
