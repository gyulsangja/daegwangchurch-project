import type { DirectoryState } from './directory';

// All names, relationships and organizations below are synthetic review data.
export function createFixture(): DirectoryState {
  const churchId = 'demo-daegwang';
  const names = ['가상교인 가람', '가상교인 나래', '가상교인 다온', '가상교인 라온', '가상교인 마루', '가상교인 보람', '가상교인 새봄', '가상교인 아람', '가상교인 여울', '가상교인 온유', '가상교인 이든', '가상교인 지음', '가상교인 초롱', '가상교인 하람'];
  return {
    churches: [{ id: churchId, name: '대광교회', statuses: [{ code: 'ACTIVE', label: '재적' }, { code: 'DECEASED', label: '소천' }, { code: 'TRANSFERRED', label: '이적' }], positions: [{ code: 'MEMBER', label: '성도' }, { code: 'DEACON', label: '집사' }, { code: 'ELDER', label: '장로' }] }, { id: 'demo-other', name: '격리 검증 교회', statuses: [{ code: 'ACTIVE', label: '재적' }], positions: [] }],
    organizations: [{ id: 'org-youth', churchId, name: '청년 모임 (예시)', parentId: null }, { id: 'org-adults', churchId, name: '장년 모임 (예시)', parentId: null }, { id: 'org-service', churchId, name: '찬양 봉사 (예시)', parentId: null }, { id: 'org-other', churchId: 'demo-other', name: '다른 교회 조직', parentId: null }],
    members: [...names.map((name, index) => ({ id: `demo-member-${index + 1}`, churchId, name, status: 'ACTIVE', position: index > 7 ? 'DEACON' : 'MEMBER', phone: '', address: '', organizationIds: index > 11 ? [] : index % 3 === 0 ? ['org-youth', 'org-service'] : index % 2 ? ['org-adults'] : ['org-youth'], version: 1, createdAt: `2026-10-${String(index + 1).padStart(2, '0')}T00:00:00.000Z`, updatedAt: '2026-10-21T00:00:00.000Z' })), { id: 'other-member', churchId: 'demo-other', name: '격리 대상 가상교인', status: 'ACTIVE', position: '', phone: '', address: '', organizationIds: ['org-other'], version: 1, createdAt: '2026-10-01T00:00:00.000Z', updatedAt: '2026-10-01T00:00:00.000Z' }],
    families: [{ id: 'family-demo', churchId, name: '가람·나래 가정 (예시)', members: [{ memberId: 'demo-member-1', relationship: '가구원' }, { memberId: 'demo-member-2', relationship: '가구원' }] }], audits: [],
  };
}
