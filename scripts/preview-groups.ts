import { canReadGroupNotice, groupPreferenceSchema, type GroupSnapshot } from '../packages/contracts/src/features/member/groups';
export const sampleGroups = [
  { id: 'fellowship-a', name: '[예시] 전도회', description: '실제 전도회 명칭과 대상은 관리자가 등록합니다.' },
  { id: 'fellowship-b', name: '[예시] 청년 모임', description: '공개 모임 소식과 소속 안내를 구분합니다.' },
  { id: 'service-team', name: '[예시] 봉사팀', description: '관심 소식 선택은 소속 가입이 아닙니다.' },
];
const notices = sampleGroups.flatMap(group => [
  { id: `${group.id}-public`, groupId: group.id, audience: 'PUBLIC' as const, title: `${group.name} 함께하는 소식`, body: '누구나 읽을 수 있는 가상 모임 안내입니다. 관심 소식에 추가하면 모아볼 수 있습니다.', publishedAt: '2026-10-04T00:00:00.000Z' },
  { id: `${group.id}-private`, groupId: group.id, audience: 'MEMBERS' as const, title: `${group.name} 소속 안내`, body: '서버에서 확인한 소속에만 제공하는 가상 안내입니다. 실제 교회 개인정보는 없습니다.', publishedAt: '2026-10-04T00:00:00.000Z' },
]);
export function createGroupPreview() {
  const settings = new Map<string, { interests: string[]; notifications: boolean; version: number }>();
  function snapshot(owner: string, email: string): GroupSnapshot {
    const preference = settings.get(owner) ?? { interests: [], notifications: false, version: 1 };
    // This fixture is server-assigned. Subscriptions and client payloads cannot grant membership.
    const memberships = email === 'demo@example.invalid' ? ['fellowship-a'] : [];
    return { ...preference, groups: sampleGroups, memberships, notices: notices.filter(notice => canReadGroupNotice(notice, memberships)) };
  }
  return { snapshot, remove: (owner: string) => settings.delete(owner),
    update(owner: string, email: string, input: unknown) {
      const value = groupPreferenceSchema.parse(input); const current = snapshot(owner, email);
      if (value.interests.some(id => !sampleGroups.some(group => group.id === id))) return { status: 422, data: null };
      if (value.version !== current.version) return { status: 409, data: null };
      settings.set(owner, { ...value, version: current.version + 1 });
      return { status: 200, data: snapshot(owner, email) };
    },
  };
}
