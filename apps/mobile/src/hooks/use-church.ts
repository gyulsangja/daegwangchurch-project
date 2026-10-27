import { useCallback } from 'react';
import { createChurchClient } from '@daegwang/api-client/church';
import { useNoticeResource } from './use-notices';
const client = createChurchClient(process.env.EXPO_PUBLIC_API_BASE_URL);
export function useChurchAbout() { return useNoticeResource(useCallback(signal => client.about(signal), []),0,'church:about'); }
export function useChurchSchedules() { return useNoticeResource(useCallback(signal => client.schedules(signal), []),0,'church:schedules'); }
export function useChurchPastor() { return useNoticeResource(useCallback(signal => client.pastor(signal), []),0,'church:pastor'); }
export function useChurchNewcomer() { return useNoticeResource(useCallback(signal => client.newcomer(signal), []),0,'church:newcomer'); }
export function useChurchContact() { return useNoticeResource(useCallback(signal => client.contact(signal), []),0,'church:contact'); }
