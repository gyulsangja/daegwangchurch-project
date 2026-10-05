import { z } from 'zod';
export function pushConfig(env: Record<string, string | undefined>) {
  const projectId = z.uuid().safeParse(env.EXPO_PUSH_PROJECT_ID);
  const workerSecret = env.APP_PUSH_WORKER_SECRET ?? '';
  return {
    available: env.APP_MEMBER_NOTIFICATIONS_ENABLED === 'true' && env.APP_PUSH_ENABLED === 'true' && projectId.success && workerSecret.length >= 32 && env.APP_PUSH_WORKER_READY === 'true',
    projectId: projectId.success ? projectId.data : '', workerSecret,
    accessToken: env.EXPO_PUSH_ACCESS_TOKEN,
  };
}
