export function decodeContentSlug(value: string) {
  try { return decodeURIComponent(value); } catch { return value; }
}

export function createContentSlug(title: string, fallback: string, uniqueId: string) {
  const base = title.normalize('NFKC').toLowerCase().replace(/[^\p{Letter}\p{Number}]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 70);
  return `${base || fallback}-${uniqueId}`;
}
