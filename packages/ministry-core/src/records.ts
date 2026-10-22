import { ministryRecordSchema, type MinistryRecordInput } from '@daegwang/contracts/ministry-records';
import type { Actor, DirectoryState, Member } from './directory';
export type Entry = MinistryRecordInput & { id: string; churchId: string; memberId: string; actorId: string; recordedAt: string; label: string; voided?: boolean; correction?: {reason:string;actorId:string;at:string} };
type Fail = (code: 'FORBIDDEN' | 'NOT_FOUND' | 'CONFLICT' | 'INVALID', message?: string) => never;
export function createRecordService(state: DirectoryState, id: () => string, now: () => string, fail: Fail, sync: (actor: Actor, member: Member) => void, roles: (actor: Actor) => {code:string;label:string}[], courses: (actor: Actor) => {code:string;label:string}[], restored: Entry[] = []) {
  const entries: Entry[] = structuredClone(restored);
  const today = () => new Date(now()).toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
  const find = (actor: Actor, memberId: string, care = false) => {
    if (!actor.id || !['ADMIN', 'OFFICE'].includes(actor.role) || (care && !actor.permissions?.includes('CARE'))) return fail('FORBIDDEN');
    const member = state.members.find(m => m.id === memberId && m.churchId === actor.churchId);
    if (!member) return fail('NOT_FOUND'); return member;
  };
  const append = (actor: Actor, member: Member, input: MinistryRecordInput, label: string) => {
    const entry: Entry = { ...input, id: id(), churchId: actor.churchId, memberId: member.id, actorId: actor.id, recordedAt: now(), label };
    entries.push(entry); return entry;
  };
  return {
    snapshot() { return structuredClone(entries); },
    correct(actor: Actor, memberId: string, entryId: string, reason: unknown) {
      find(actor, memberId);
      const entry = entries.find(e => e.churchId === actor.churchId && e.memberId === memberId && e.id === entryId);
      if (!entry) return fail('NOT_FOUND');
      find(actor, memberId, entry.kind === 'CARE');
      if (!['SERVICE', 'ATTENDANCE', 'CARE', 'EDUCATION'].includes(entry.kind)) return fail('INVALID', '직분·상태는 올바른 발생일로 변경 기록을 추가해 주세요.');
      if (entry.voided) return fail('CONFLICT');
      if (typeof reason !== 'string' || !reason.trim() || reason.length > 300) return fail('INVALID', '정정 사유를 입력해 주세요.');
      entry.voided = true; entry.correction = {reason:reason.trim(),actorId:actor.id,at:now()};
      state.audits.push({id:id(),churchId:actor.churchId,actorId:actor.id,memberId,action:'UPDATE',fields:['recordCorrection'],at:now()});
      return {id:entry.id};
    },
    list(actor: Actor, memberId: string) {
      find(actor, memberId);
      state.audits.push({id:id(),churchId:actor.churchId,actorId:actor.id,memberId,action:'READ',fields:['ministryRecords'],at:now()});
      return structuredClone(entries.filter(e => e.churchId === actor.churchId && e.memberId === memberId && (e.kind !== 'CARE' || actor.permissions?.includes('CARE'))).sort((a,b) => b.date.localeCompare(a.date) || b.recordedAt.localeCompare(a.recordedAt)));
    },
    capture(actor: Actor, before: Member, after: Member) {
      const config = state.churches.find(c => c.id === actor.churchId)!;
      for (const [field, kind, codes] of [['position', 'POSITION', config.positions], ['status', 'STATUS', config.statuses]] as const) {
        if (before[field] !== after[field]) append(actor, after, { kind, value: after[field], date: today(), note: '현재 정보 변경에 따른 기록 (실제 취임·변동일은 별도 확인 필요)' }, codes.find(c => c.code === after[field])?.label ?? '미지정');
      }
    },
    add(actor: Actor, memberId: string, raw: unknown) {
      const input = ministryRecordSchema.parse(raw); const member = find(actor, memberId, input.kind === 'CARE');
      if (input.date > today()) fail('INVALID', '미래 날짜의 이력은 아직 등록할 수 없습니다.');
      const config = state.churches.find(c => c.id === actor.churchId)!;
      let label: string = input.kind;
      if (input.kind === 'EDUCATION') {
        const course = courses(actor).find(c => c.code === input.courseId);
        if (!course) return fail('INVALID', '환경설정에 등록된 교육 과정을 선택해 주세요.');
        if (input.value !== 'IN_PROGRESS' && !input.endDate) return fail('INVALID', '수료·중단일을 입력해 주세요.');
        if (input.value === 'IN_PROGRESS' && input.endDate) return fail('INVALID', '수강 중에는 종료일을 비워 주세요.');
        if (input.endDate && (input.endDate < input.date || input.endDate > today())) return fail('INVALID', '종료일은 시작일 이후부터 오늘까지 선택해 주세요.');
        if (entries.some(e => !e.voided && e.churchId === actor.churchId && e.memberId === memberId && e.kind === 'EDUCATION' && e.courseId === input.courseId && e.cohort === input.cohort && e.date === input.date)) return fail('CONFLICT', '같은 교육 참여 기록이 있습니다. 기존 기록을 정정한 뒤 변경 내용을 등록해 주세요.');
        label = `${course.label}${input.cohort ? ` · ${input.cohort}` : ''} · ${{IN_PROGRESS:'수강 중',COMPLETED:'수료',STOPPED:'중단'}[input.value]}`;
      }
      if (input.kind === 'POSITION' || input.kind === 'STATUS') {
        const code = (input.kind === 'POSITION' ? config.positions : config.statuses).find(c => c.code === input.value);
        if (!code) return fail('INVALID'); label = code.label;
      }
      if (input.kind === 'SETTLEMENT') label = { NEW: '새가족', LEARNING: '교육 중', SETTLED: '정착' }[input.value];
      if (input.kind === 'SERVICE' || input.kind === 'ATTENDANCE') {
        const org = state.organizations.find(o => o.id === input.organizationId && o.churchId === actor.churchId);
        if ((input.organizationId || input.kind === 'SERVICE') && !org) return fail('INVALID');
        label = org?.name ?? '교회 전체';
        if (input.kind === 'SERVICE') {
          const role = roles(actor).find(r => r.code === input.role);
          if (input.role && !role) return fail('INVALID');
          label += ` · ${role?.label ?? '구성원'}`;
          if (input.endDate && input.endDate < input.date) fail('INVALID', '종료일은 시작일보다 빠를 수 없습니다.');
          if (entries.some(e => !e.voided && e.churchId === actor.churchId && e.memberId === memberId && e.kind === 'SERVICE' && e.organizationId === input.organizationId && e.role === input.role && e.date <= (input.endDate ?? '9999-12-31') && (e.endDate ?? '9999-12-31') >= input.date)) fail('CONFLICT', '같은 조직·역할의 활동 기간이 겹칩니다. 기존 기록을 정정한 후 등록해 주세요.');
        } else {
          label += ` · ${input.event} · ${{PRESENT:'출석',ABSENT:'결석',EXCUSED:'사유 결석',ONLINE:'온라인'}[input.value]}`;
          if (entries.some(e => !e.voided && e.churchId === actor.churchId && e.memberId === memberId && e.kind === 'ATTENDANCE' && e.date === input.date && e.event === input.event && e.organizationId === input.organizationId)) fail('CONFLICT', '같은 날짜·예배/모임의 출석이 이미 있습니다. 기존 기록을 정정해 주세요.');
        }
      }
      if (input.kind === 'CARE') { label = input.category === 'COUNSEL' ? '목회 상담' : '심방'; if (input.nextDate && input.nextDate < input.date) fail('INVALID', '후속 일정은 상담일 이후로 지정해 주세요.'); }
      const entry = append(actor, member, input, label);
      state.audits.push({id:id(),churchId:actor.churchId,actorId:actor.id,memberId,action:'UPDATE',fields:['ministryRecord'],at:now()});
      // Backdated history must not overwrite a later effective change.
      if (input.kind === 'POSITION' || input.kind === 'STATUS') {
        const latest = entries.filter(e => !e.voided && e.churchId === actor.churchId && e.memberId === memberId && e.kind === input.kind).sort((a,b) => b.date.localeCompare(a.date) || entries.indexOf(b)-entries.indexOf(a))[0];
        if (latest === entry) { member[input.kind === 'POSITION' ? 'position' : 'status'] = input.value; member.version++; member.updatedAt = now(); sync(actor, member); }
      }
      return { id: entry.id };
    },
  };
}
