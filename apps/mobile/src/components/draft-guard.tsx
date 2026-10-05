import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useNavigation } from 'expo-router';
import { usePreventRemove, type NavigationAction } from 'expo-router/react-navigation';
import { ConfirmDialog } from './confirm-dialog';
export function DraftGuard({ dirty, busy = false, onDiscard }: { dirty: boolean; busy?: boolean; onDiscard?: () => void }) {
  const navigation = useNavigation(); const [pending, setPending] = useState<NavigationAction | null>(null);
  usePreventRemove(dirty || busy, ({ data }) => { if (!busy) setPending(data.action); });
  useEffect(() => { if (Platform.OS !== 'web' || !dirty) return; const guard = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; }; window.addEventListener('beforeunload', guard); return () => window.removeEventListener('beforeunload', guard); }, [dirty]);
  return <ConfirmDialog visible={!!pending} title="작성을 그만둘까요?" message="저장하지 않은 내용은 사라집니다." confirmLabel="저장하지 않고 나가기" onCancel={() => setPending(null)} onConfirm={() => { const action = pending; onDiscard?.(); setPending(null); if (action) navigation.dispatch(action); }} />;
}
