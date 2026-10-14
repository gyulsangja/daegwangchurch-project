import { createWorshipClient } from '@daegwang/api-client/worship';
import type { WorshipListOptions, WorshipPage } from '@daegwang/api-client/worship';
import { createPublicCache } from '@daegwang/api-client/public-cache';
export * from '@daegwang/api-client/worship';
const client = createWorshipClient(process.env.EXPO_PUBLIC_API_BASE_URL);
const cache = createPublicCache<WorshipPage>();
const key = (options: WorshipListOptions = {}) => JSON.stringify(Object.entries(options).filter(([name, value]) => name !== 'signal' && value !== undefined && value !== '').sort(([a], [b]) => a.localeCompare(b)));
export const cachedWorshipPage = (options: WorshipListOptions = {}) => cache.peek(key(options));
export const worshipClient = { ...client, list: (options: WorshipListOptions = {}, force = false) => {
  // Shared requests outlive one screen; callers still guard their own UI with the signal.
  const query = { ...options, signal: undefined };
  return cache.read(key(query), () => client.list(query), force);
} };
export const preloadWorship = () => Promise.allSettled([worshipClient.list(), worshipClient.list({ type: 'ALL', group: 'sunday' })]);
