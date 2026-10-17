// Only extract known display fields, never stringify arbitrary metadata.
export function notificationText(value: unknown, limit = 180): string {
  const text = typeof value === 'string' ? value : value && typeof value === 'object' && 'body' in value && typeof value.body === 'string' ? value.body : '';
  return text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, limit);
}
export function notificationPreview(kind: string, title: string, body: string, publicGroup = false) {
  if (kind === 'schedules') return { title: '대광교회 · 일정 알림', body: '예정된 일정이 곧 시작됩니다. 앱에서 내용을 확인해 주세요.' };
  if (kind === 'groups' && !publicGroup) return { title: '대광교회 · 모임 공지', body: '소속 모임의 새 공지가 있습니다. 앱에서 내용을 확인해 주세요.' };
  const labels: Record<string, string> = { devotional: '첫시간 주님께', sermons: '예배 말씀', notices: '교회 공지', events: '교회 행사', groups: '모임 소식' };
  return { title: `${labels[kind] ?? '대광교회'} · ${notificationText(title, 80)}`, body: notificationText(body) || '알림을 눌러 자세한 내용을 확인해 주세요.' };
}
