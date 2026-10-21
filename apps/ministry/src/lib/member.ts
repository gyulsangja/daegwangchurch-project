import { notFound } from 'next/navigation';
import { isDirectoryError, type createDirectory, type Actor } from '@daegwang/ministry-core/directory';
export function memberOr404(service: ReturnType<typeof createDirectory>, actor: Actor, id: string) {
  try { return service.detail(actor, id); } catch (error) { if (isDirectoryError(error) && error.code === 'NOT_FOUND') notFound(); throw error; }
}
