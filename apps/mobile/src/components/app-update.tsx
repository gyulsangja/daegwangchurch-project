import * as Application from 'expo-application';
import { useEffect } from 'react';
import { Alert, AppState, Linking, Platform } from 'react-native';
import { getAndroidUpdate } from '@daegwang/contracts/app-release';

// At most once per foreground session; failed network checks never block the app.
export function AppUpdate() {
  useEffect(() => {
    if (Platform.OS !== 'android' || __DEV__) return;
    let disposed = false;
    let busy = false;
    let lastCheck = 0;
    let promptedBuild = 0;
    let controller: AbortController | undefined;
    const check = async () => {
      if (busy || AppState.currentState !== 'active' || Date.now() - lastCheck < 60_000) return;
      busy = true;
      lastCheck = Date.now();
      controller = new AbortController();
      const timeout = setTimeout(() => controller?.abort(), 8000);
      try {
        const response = await fetch('https://daegwangchurch.kr/api/app-release', { signal: controller.signal, cache: 'no-store' });
        if (!response.ok) return;
        const release = getAndroidUpdate(await response.json(), Application.nativeBuildVersion, Application.applicationId);
        if (disposed || AppState.currentState !== 'active' || !release || release.build === promptedBuild) return;
        promptedBuild = release.build;
        Alert.alert('새 버전이 나왔어요', `대광교회 ${release.version}\n\n${release.notes}\n\n다운로드한 파일을 열고 ‘업데이트’를 눌러 주세요. 기존 앱은 삭제하지 않으셔도 됩니다.`, [
          { text: '나중에', style: 'cancel' },
          { text: '업데이트 다운로드', onPress: () => {
            void Linking.openURL(release.downloadUrl).catch(() => {
              promptedBuild = 0;
              Alert.alert('다운로드를 열 수 없어요', '휴대폰 브라우저에서 daegwangchurch.kr/app에 접속해 주세요.');
            });
          } },
        ]);
      } catch {
        // Offline, timeout and malformed responses leave normal use available.
      } finally {
        clearTimeout(timeout);
        busy = false;
      }
    };
    void check();
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') void check(); });
    return () => { disposed = true; controller?.abort(); subscription.remove(); };
  }, []);
  return null;
}
