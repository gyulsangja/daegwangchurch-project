import { useCallback } from 'react';
import { createAccountClient } from '@daegwang/api-client/member-extras';
import { useNoticeResource } from './use-notices';
export const accountClient = createAccountClient(process.env.EXPO_PUBLIC_API_BASE_URL);
export function useMemberOptions() { return useNoticeResource(useCallback(signal => accountClient.options(signal), [])); }
