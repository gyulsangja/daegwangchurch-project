import { z } from 'zod';

export const androidReleaseSchema = z.object({
  applicationId: z.literal('org.daegwangchurch.app'),
  version: z.string().min(1).max(30),
  build: z.number().int().positive(),
  downloadUrl: z.string().regex(/^https:\/\/expo\.dev\/artifacts\/eas\/[\w-]+\.apk$/),
  notes: z.string().max(1000),
});

export function getAndroidUpdate(value: unknown, installedBuild: string | null, applicationId: string | null) {
  const parsed = androidReleaseSchema.safeParse(value);
  if (!parsed.success || applicationId !== parsed.data.applicationId || !installedBuild || !/^\d+$/.test(installedBuild)) return null;
  const current = Number(installedBuild);
  return Number.isSafeInteger(current) && current > 0 && parsed.data.build > current ? parsed.data : null;
}
