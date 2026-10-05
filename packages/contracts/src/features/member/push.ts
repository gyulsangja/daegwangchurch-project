import { z } from 'zod';

export const pushCredentialSchema = z.object({
  installationId: z.uuid(),
  secret: z.string().regex(/^[a-f0-9-]{72}$/),
}).strict();
export const pushRegistrationSchema = pushCredentialSchema.extend({
  token: z.string().regex(/^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]{10,200}\]$/),
  platform: z.enum(['android', 'ios']),
  projectId: z.uuid(),
}).strict();
export const pushDeviceSchema = z.object({ id: z.uuid(), platform: z.enum(['android', 'ios']), expiresAt: z.iso.datetime() });
export const pushStatusSchema = z.object({ available: z.boolean(), devices: z.array(pushDeviceSchema).max(5) });
export type PushCredential = z.infer<typeof pushCredentialSchema>;
export type PushRegistration = z.infer<typeof pushRegistrationSchema>;
