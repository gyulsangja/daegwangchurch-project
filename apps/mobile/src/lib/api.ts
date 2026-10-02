import { createWorshipClient } from '@daegwang/api-client/worship';
export * from '@daegwang/api-client/worship';
export const worshipClient = createWorshipClient(process.env.EXPO_PUBLIC_API_BASE_URL);
