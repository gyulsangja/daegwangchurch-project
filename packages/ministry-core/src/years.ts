import { yearCreateSchema, yearConfigSchema, yearAssignmentSchema, yearActivateSchema, organizationRosterSchema, organizationRoleCodes } from '@daegwang/contracts/ministry-years';
import type { Actor, DirectoryState, Member } from './directory';

type Code = { code: string; label: string };
export type AnnualAssignment = { memberId: string; name: string; position: string; affiliations: { organizationId: string; role: string }[] };
export type MinistryYear = {
  churchId: string; year: number; state: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'; version: number;
  name: string; positions: Code[]; statuses: Code[]; organizationTypes: Code[]; roles: Code[]; courses: Code[];
  organizations: { id: string; name: string; parentId: string | null; type: string; roleCodes?:string[] }[];
  assignments: AnnualAssignment[];
  events: { at: string; actorId: string; action: string; memberId?: string; assignment?: AnnualAssignment }[];
};

export function createYearService(state: DirectoryState, now: () => string, fail: (code: 'FORBIDDEN' | 'NOT_FOUND' | 'CONFLICT' | 'INVALID', message?: string) => never, capture: (actor: Actor, before: Member, after: Member) => void = () => {}) {
  const periods: MinistryYear[] = state.churches.map(church => ({
    churchId: church.id, year: Number(now().slice(0, 4)), state: 'ACTIVE', version: 1,
    name: church.name, positions: structuredClone(church.positions), statuses: structuredClone(church.statuses),
    courses: [{code:'NEWCOMER',label:'새가족 교육'},{code:'BAPTISM',label:'세례 교육'},{code:'DISCIPLE',label:'제자훈련'},{code:'BIBLE',label:'성경공부'},{code:'TEACHER',label:'교사 교육'}],
    organizationTypes: [{ code: 'DEPARTMENT', label: '부서' }, { code: 'FELLOWSHIP', label: '전도회' }, { code: 'SMALL_GROUP', label: '소그룹' }, { code: 'SCHOOL', label: '교회학교' }, { code: 'SERVICE', label: '봉사팀' }],
    roles: [{ code: 'LEADER', label: '회장' }, { code: 'SECRETARY', label: '총무' }, { code: 'TREASURER', label: '회계' }, { code: 'STUDENT', label: '학생' }, { code: 'TEACHER', label: '교사' }, { code: 'VOLUNTEER', label: '봉사자' }, { code: 'DIRECTOR', label: '부장' }],
    organizations: state.organizations.filter(o => o.churchId === church.id).map(o => ({ id: o.id, name: o.name, parentId: o.parentId, type: o.id === 'org-service' ? 'SERVICE' : o.id === 'org-youth' || o.id === 'org-adults' ? 'FELLOWSHIP' : 'DEPARTMENT' })),
    assignments: state.members.filter(m => m.churchId === church.id).map(m => ({ memberId: m.id, name: m.name, position: m.position, affiliations: m.organizationIds.map(organizationId => ({ organizationId, role: '' })) })), events: [],
  }));
  const authorize = (actor: Actor, write = false) => {
    if (!actor.id || !state.churches.some(c => c.id === actor.churchId) || (write ? actor.role !== 'ADMIN' : !['ADMIN', 'OFFICE'].includes(actor.role))) fail('FORBIDDEN');
  };
  const get = (actor: Actor, year: number) => {
    authorize(actor); const period = periods.find(p => p.churchId === actor.churchId && p.year === year);
    if (!period) return fail('NOT_FOUND'); return period;
  };
  const current = (churchId: string) => periods.find(p => p.churchId === churchId && p.state === 'ACTIVE')!;
  const edit = (actor: Actor, year: number, version: number) => {
    authorize(actor, true); const period = get(actor, year);
    if (period.state === 'ARCHIVED') fail('CONFLICT', '마감된 연도는 조회만 가능합니다. 새 연도로 복사해 수정해 주세요.');
    if (period.version !== version) fail('CONFLICT', '연도 정보가 변경되었습니다. 새로고침 후 다시 시도해 주세요.');
    return period;
  };
  const event = (period: MinistryYear, actor: Actor, action: string, memberId?: string) => {
    const assignment = memberId ? period.assignments.find(a => a.memberId === memberId) : undefined;
    period.version++; period.events.push({ at: now(), actorId: actor.id, action, ...(memberId ? { memberId } : {}), ...(assignment ? {assignment:structuredClone(assignment)} : {}) });
  };
  const apply = (period: MinistryYear, actor: Actor) => {
    const church = state.churches.find(c => c.id === period.churchId)!;
    Object.assign(church, { name: period.name, statuses: structuredClone(period.statuses), positions: structuredClone(period.positions) });
    state.organizations = [...state.organizations.filter(o => o.churchId !== period.churchId), ...period.organizations.map(o => ({ ...o, churchId: period.churchId }))];
    for (const member of state.members.filter(m => m.churchId === period.churchId)) {
      const assignment = period.assignments.find(a => a.memberId === member.id);
      if (!assignment) continue;
      const before = structuredClone(member);
      member.position = assignment.position; member.organizationIds = assignment.affiliations.map(a => a.organizationId);
      if (before.position !== member.position || JSON.stringify(before.organizationIds) !== JSON.stringify(member.organizationIds)) {
        member.version++; member.updatedAt = now(); capture(actor, before, member);
      }
    }
  };
  const validateReferences = (period: MinistryYear) => {
    for (const catalog of [period.positions, period.statuses, period.organizationTypes, period.roles, period.courses]) {
      if (new Set(catalog.map(c => c.code)).size !== catalog.length || new Set(catalog.map(c => c.label)).size !== catalog.length) fail('INVALID', '같은 코드나 이름을 중복 등록할 수 없습니다.');
    }
    if (new Set(period.organizations.map(o => o.id)).size !== period.organizations.length) fail('INVALID');
    for (const org of period.organizations) {
      const codes = organizationRoleCodes(org);
      if (new Set(codes).size !== codes.length || codes.some(code => !period.roles.some(r => r.code === code))) fail('INVALID', '조직에서 사용하는 역할을 먼저 확인해 주세요.');
      if (!period.organizationTypes.some(t => t.code === org.type)) fail('INVALID', '사용 중인 조직 유형은 삭제할 수 없습니다.');
      const visited = new Set([org.id]); let parent = org.parentId;
      while (parent) {
        if (visited.has(parent)) fail('INVALID', '조직을 자기 자신이나 하위 조직 아래로 이동할 수 없습니다.');
        visited.add(parent); const found = period.organizations.find(o => o.id === parent);
        if (!found) fail('INVALID', '상위 조직을 먼저 확인해 주세요.'); parent = found!.parentId;
      }
    }
    for (const a of period.assignments) {
      if (!state.members.some(m => m.id === a.memberId && m.churchId === period.churchId)) fail('INVALID');
      if (a.position && !period.positions.some(p => p.code === a.position)) fail('INVALID', '배정된 직분은 삭제할 수 없습니다. 먼저 해당 교인의 직분을 변경해 주세요.');
      if (new Set(a.affiliations.map(f => f.organizationId)).size !== a.affiliations.length) fail('INVALID', '같은 조직에 중복 배정할 수 없습니다.');
      for (const f of a.affiliations) {
        if (!period.organizations.some(o => o.id === f.organizationId)) fail('INVALID', '구성원이 있는 조직은 삭제할 수 없습니다. 먼저 소속을 옮겨 주세요.');
        if (f.role && !period.roles.some(r => r.code === f.role)) fail('INVALID', '배정된 역할은 삭제할 수 없습니다. 먼저 역할을 변경해 주세요.');
        if (f.role && !organizationRoleCodes(period.organizations.find(o => o.id === f.organizationId)!).includes(f.role)) fail('INVALID', '해당 조직에서 사용하는 역할만 배정할 수 있습니다. 조직의 역할 설정을 확인해 주세요.');
      }
    }
  };
  return {
    roster(actor: Actor, year: number, raw: unknown) {
      const data = organizationRosterSchema.parse(raw); const period = edit(actor,year,data.version);
      if (!period.organizations.some(o=>o.id===data.organizationId)) return fail('NOT_FOUND');
      if (new Set(data.members.map(m=>m.memberId)).size !== data.members.length) fail('INVALID','구성원이 중복되었습니다.');
      const candidate = structuredClone(period);
      for (const row of data.members) {
        const member = state.members.find(m=>m.id===row.memberId && m.churchId===actor.churchId);
        if (!member) return fail('NOT_FOUND');
        if (!candidate.assignments.some(a=>a.memberId===member.id)) candidate.assignments.push({memberId:member.id,name:member.name,position:period.positions.some(p=>p.code===member.position)?member.position:'',affiliations:[]});
      }
      const changed: string[]=[];
      for (const assignment of candidate.assignments) {
        const row=data.members.find(m=>m.memberId===assignment.memberId);
        const before=JSON.stringify(assignment.affiliations);
        assignment.affiliations=assignment.affiliations.filter(a=>a.organizationId!==data.organizationId);
        if(row) assignment.affiliations.push({organizationId:data.organizationId,role:row.role});
        if(before!==JSON.stringify(assignment.affiliations)) changed.push(assignment.memberId);
      }
      validateReferences(candidate);
      for(const memberId of changed) event(period,actor,'조직 일괄 배정 전',memberId);
      period.assignments=candidate.assignments;
      for(const memberId of changed) event(period,actor,'조직 일괄 배정 후',memberId);
      if(period.state==='ACTIVE') apply(period,actor);
      return {version:period.version,changed:changed.length};
    },
    activeYear(churchId: string) { return current(churchId).year; },
    // Called only after directory authorization/validation. Archived snapshots never change.
    syncMember(actor: Actor, member: Member) {
      const period = current(member.churchId); const existing = period.assignments.find(a => a.memberId === member.id);
      const replacement: AnnualAssignment = { memberId: member.id, name: member.name, position: member.position, affiliations: member.organizationIds.map(organizationId => ({ organizationId, role: existing?.affiliations.find(a => a.organizationId === organizationId)?.role ?? '' })) };
      if (existing) { event(period, actor, '변경 전 배정 보존', member.id); Object.assign(existing, replacement); } else period.assignments.push(replacement);
      event(period, actor, '교인 정보 반영', member.id);
    },
    list(actor: Actor) { authorize(actor); return periods.filter(p => p.churchId === actor.churchId).sort((a,b) => b.year-a.year).map(p => ({ year: p.year, state: p.state, version: p.version })); },
    read(actor: Actor, year: number) { return structuredClone(get(actor, year)); },
    memberHistory(actor: Actor, memberId: string) {
      authorize(actor);
      if (!state.members.some(m => m.id === memberId && m.churchId === actor.churchId)) return fail('NOT_FOUND');
      return periods.filter(p => p.churchId === actor.churchId && p.state !== 'DRAFT').sort((a,b) => b.year-a.year).flatMap(p => {
        const a = p.assignments.find(a => a.memberId === memberId); if (!a) return [];
        return [{ year: p.year, state: p.state, position: p.positions.find(c => c.code === a.position)?.label ?? '미지정', affiliations: a.affiliations.map(f => ({ name: p.organizations.find(o => o.id === f.organizationId)?.name ?? '', role: p.roles.find(r => r.code === f.role)?.label ?? '' })) }];
      });
    },
    create(actor: Actor, raw: unknown) {
      authorize(actor, true); const data = yearCreateSchema.parse(raw); const source = get(actor, data.sourceYear);
      if (source.version !== data.sourceVersion) fail('CONFLICT');
      if (periods.some(p => p.churchId === actor.churchId && p.year === data.year)) fail('CONFLICT', '이미 생성된 연도입니다. 기존 연도를 선택해 주세요.');
      if (data.year <= current(actor.churchId).year || data.year <= source.year) fail('INVALID', '운영 연도와 복사 기준보다 이후 연도를 선택해 주세요.');
      if (data.copyRoles && !data.copyMembers) fail('INVALID', '임원 역할을 복사하려면 소속도 복사해야 합니다.');
      const next = structuredClone(source);
      Object.assign(next, { year: data.year, state: 'DRAFT', version: 1, events: [{ at: now(), actorId: actor.id, action: `${source.year}년에서 준비 연도 생성` }] });
      next.assignments = state.members.filter(m => m.churchId === actor.churchId).map(m => {
        const a = source.assignments.find(a => a.memberId === m.id);
        return { memberId: m.id, name: m.name, position: a?.position ?? (next.positions.some(p => p.code === m.position) ? m.position : ''), affiliations: data.copyMembers && a ? a.affiliations.map(f => ({ ...f, role: data.copyRoles ? f.role : '' })) : [] };
      });
      validateReferences(next); periods.push(next); return { year: next.year };
    },
    configure(actor: Actor, year: number, raw: unknown) {
      const data = yearConfigSchema.parse(raw); const period = edit(actor, year, data.version);
      const candidate = { ...structuredClone(period), ...data };
      validateReferences(candidate);
      if (candidate.state === 'ACTIVE' && state.members.some(m => m.churchId === actor.churchId && !candidate.statuses.some(s => s.code === m.status))) fail('INVALID', '사용 중인 교적 상태는 삭제할 수 없습니다.');
      Object.assign(period, candidate); event(period, actor, '교회·직분·조직 체계 수정');
      if (period.state === 'ACTIVE') apply(period, actor);
      return { version: period.version };
    },
    assign(actor: Actor, year: number, raw: unknown) {
      const data = yearAssignmentSchema.parse(raw); const period = edit(actor, year, data.version);
      const member = state.members.find(m => m.churchId === actor.churchId && m.id === data.memberId);
      if (!member) return fail('NOT_FOUND');
      const candidate = structuredClone(period); const a = { memberId: member.id, name: member.name, position: data.position, affiliations: data.affiliations };
      candidate.assignments = [...candidate.assignments.filter(p => p.memberId !== member.id), a];
      validateReferences(candidate); event(period, actor, '변경 전 배정 보존', member.id); period.assignments = candidate.assignments;
      event(period, actor, '직분·소속·임원 역할 변경', member.id);
      if (period.state === 'ACTIVE') apply(period, actor);
      return { version: period.version };
    },
    activate(actor: Actor, year: number, raw: unknown) {
      const data = yearActivateSchema.parse(raw); const period = edit(actor, year, data.version); const active = current(actor.churchId);
      if (period.state !== 'DRAFT' || period.year <= active.year) fail('INVALID');
      if (active.version !== data.activeVersion) fail('CONFLICT', '운영 연도 정보가 변경되었습니다. 최신 구성을 확인하고 다시 전환해 주세요.');
      if (state.members.some(m => m.churchId === actor.churchId && !period.assignments.some(a => a.memberId === m.id))) fail('INVALID', '준비 이후 등록된 교인이 있습니다. 구성원 배정에서 확인 후 전환해 주세요.');
      if (state.members.some(m => m.churchId === actor.churchId && !period.statuses.some(s => s.code === m.status))) fail('INVALID', '현재 교인이 사용하는 교적 상태를 새 연도에도 등록해 주세요.');
      validateReferences(period); active.state = 'ARCHIVED'; event(active, actor, `${period.year}년 전환으로 마감`);
      period.state = 'ACTIVE'; event(period, actor, '운영 연도로 전환'); apply(period, actor);
      return { year: period.year };
    },
  };
}
