export const isNoticeImage = (mimeType: string) => ['image/jpeg', 'image/png', 'image/webp'].includes(mimeType);
export function decodeNoticeSlug(value: string) {
  try { return decodeURIComponent(value); } catch { return value; }
}
