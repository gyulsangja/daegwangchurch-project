// Read every page before showing a complete monthly calendar; never label a partial set complete.
export async function collectPages<T>(read: (page: number, signal: AbortSignal) => Promise<{ data: T[]; nextPage: number | null }>, signal: AbortSignal): Promise<T[]> {
  const rows: T[] = []; let page = 0; const visited = new Set<number>(); const ids = new Set<string>();
  while (!signal.aborted) {
    if (visited.has(page) || visited.size >= 100) throw new Error('자료가 많아 월 전체 표시를 완료하지 못했습니다. 목록으로 확인해 주세요.');
    visited.add(page); const result = await read(page, signal);
    for (const row of result.data) { const id = row && typeof row === 'object' && 'id' in row && typeof row.id === 'string' ? row.id : null; if (id && ids.has(id)) continue; if (id) ids.add(id); rows.push(row); }
    if (result.nextPage === null) return rows; page = result.nextPage;
  }
  throw new Error('조회가 취소되었습니다.');
}
