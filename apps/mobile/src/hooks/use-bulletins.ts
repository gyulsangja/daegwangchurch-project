import { useCallback } from 'react';
import { createBulletinClient } from '@daegwang/api-client/bulletins';
import { useNoticeResource } from './use-notices';
const client = createBulletinClient(process.env.EXPO_PUBLIC_API_BASE_URL);
export function useBulletinList(page: number, month: string) { return useNoticeResource(useCallback(signal => client.list(page, month, signal), [page, month])); }
export function useBulletin(id: string) { return useNoticeResource(useCallback(signal => client.detail(id, signal), [id])); }
