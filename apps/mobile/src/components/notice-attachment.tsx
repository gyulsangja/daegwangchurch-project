import { useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, Text, View } from 'react-native';
import { isNoticeImage } from '@daegwang/contracts/features/notices/attachments';
import { styles } from './ui';
import { useFeatureNotice } from './app-screen';

export function NoticeAttachment({ file }: { file: { name: string; url: string; mimeType: string; sizeBytes: number } }) {
  const [ratio, setRatio] = useState(1);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const notice = useFeatureNotice();
  const open = () => { void Linking.openURL(file.url).catch(() => notice('첨부파일을 열지 못했습니다', '연결 상태를 확인하고 다시 시도해 주세요.')); };
  return <View style={{ gap: 8 }}>
    {isNoticeImage(file.mimeType) && <>
      {loading && <ActivityIndicator accessibilityLabel="첨부 이미지 불러오는 중" />}
      {failed ? <Text style={styles.caption}>이미지를 불러오지 못했어요. 아래에서 다시 열어 주세요.</Text> :
        <Pressable accessibilityRole="button" accessibilityLabel={`${file.name} 크게 보기`} onPress={open}>
          <Image source={{ uri: file.url }} accessibilityLabel={file.name} resizeMode="contain" style={{ width: '100%', aspectRatio: ratio, borderRadius: 12 }}
            onLoad={event => { const { width, height } = event.nativeEvent.source; if (width > 0 && height > 0) setRatio(width / height); setLoading(false); }}
            onError={() => { setFailed(true); setLoading(false); }} />
        </Pressable>}
    </>}
    <Pressable accessibilityRole="button" accessibilityLabel={`${file.name} 외부에서 열기`} style={{ minHeight: 48, justifyContent: 'center' }} onPress={open}>
      <Text style={styles.caption}>{file.name} · {Math.max(1, Math.ceil(file.sizeBytes / 1024))} KB · {isNoticeImage(file.mimeType) ? '크게 보기' : '외부에서 열기'} ›</Text>
    </Pressable>
  </View>;
}
