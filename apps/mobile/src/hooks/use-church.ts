import { useCallback } from 'react';
import { createChurchClient } from '@daegwang/api-client/church';
import { useNoticeResource } from './use-notices';
const client = createChurchClient(process.env.EXPO_PUBLIC_API_BASE_URL);
export function useChurchAbout() { return useNoticeResource(useCallback(signal => client.about(signal), [])); }
export function useChurchSchedules() { return useNoticeResource(useCallback(signal => client.schedules(signal), [])); }
export function useChurchPastor() { return useNoticeResource(useCallback(signal => client.pastor(signal), [])); }
export function useChurchNewcomer() { return useNoticeResource(useCallback(signal => client.newcomer(signal), [])); }
export function useChurchContact() { return useNoticeResource(useCallback(signal => client.contact(signal), [])); }
