import { useEffect, useState } from 'react';
import { draftCache } from '../lib/draft-cache';
import { useMemberSession } from '../components/member-session';
export function useDraftCache<T>(key: string, value: T, dirty: boolean) {
  const { session } = useMemberSession(); const owner = session?.user.id ?? '';
  const [restored] = useState(() => draftCache.read<T>(owner, key));
  useEffect(() => { if (dirty) draftCache.write(owner, key, value); }, [owner, key, value, dirty]);
  return { restored, clear: () => draftCache.remove(owner, key) };
}
