import { notFound } from 'next/navigation';
import { isDirectoryError,type Actor } from '@daegwang/ministry-core/directory';
import type {AsyncDirectory} from '@daegwang/ministry-core/async-directory';
export async function memberOr404(service:AsyncDirectory, actor: Actor, id: string) {
  try { return await service.detail(actor, id); } catch (error) { if (isDirectoryError(error) && error.code === 'NOT_FOUND') notFound(); throw error; }
}
