import { revalidatePath as invalidate } from 'next/cache';
export function revalidatePath(path: string, type?: 'page' | 'layout') {
 if (path === '/admin' || path.startsWith('/admin/')) invalidate(path, type);
}
