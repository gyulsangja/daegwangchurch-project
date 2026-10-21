import { memberInputSchema, memberSearchSchema, memberUpdateSchema, type MemberInput } from '@daegwang/contracts/ministry';

export type Actor = { id: string; churchId: string; role: 'ADMIN' | 'OFFICE' | 'LEADER'; organizationIds: string[] };
export type Organization = { id: string; churchId: string; name: string; parentId: string | null };
export type Family = { id: string; churchId: string; name: string; members: { memberId: string; relationship: string }[] };
export type Member = MemberInput & { id: string; churchId: string; version: number; createdAt: string; updatedAt: string };
export type Audit = { id: string; churchId: string; actorId: string; memberId: string; action: 'CREATE' | 'UPDATE' | 'READ'; fields: string[]; at: string };
export type Church = { id: string; name: string; statuses: { code: string; label: string }[]; positions: { code: string; label: string }[] };
export type DirectoryState = { churches: Church[]; members: Member[]; organizations: Organization[]; families: Family[]; audits: Audit[] };
export class DirectoryError extends Error { constructor(public code: 'FORBIDDEN' | 'NOT_FOUND' | 'CONFLICT' | 'INVALID') { super(code); this.name = 'DirectoryError'; } }
// Next development bundles may load the shared module in separate contexts.
export function isDirectoryError(error: unknown): error is DirectoryError {
  return error instanceof Error && error.name === 'DirectoryError' && 'code' in error && ['FORBIDDEN', 'NOT_FOUND', 'CONFLICT', 'INVALID'].includes(String(error.code));
}

// Initial in-memory adapter for local workflow review; not a production database.
// Production writes must move version checks and audit insertion into one DB transaction.
export function createDirectory(initial: DirectoryState, id: () => string, now = () => new Date().toISOString()) {
  const state = structuredClone(initial);
  const church = (actor: Actor) => {
    if (!actor.id || !['ADMIN', 'OFFICE', 'LEADER'].includes(actor.role)) throw new DirectoryError('FORBIDDEN');
    const found = state.churches.find(item => item.id === actor.churchId);
    if (!found) throw new DirectoryError('FORBIDDEN');
    return found;
  };
  const visible = (actor: Actor, member: Member) => member.churchId === actor.churchId && (actor.role !== 'LEADER' || member.organizationIds.some(org => actor.organizationIds.includes(org)));
  const find = (actor: Actor, memberId: string) => {
    church(actor);
    const member = state.members.find(item => item.id === memberId && visible(actor, item));
    if (!member) throw new DirectoryError('NOT_FOUND');
    return member;
  };
  const allowedInput = (actor: Actor, input: MemberInput) => {
    const config = church(actor);
    if (actor.role === 'LEADER') throw new DirectoryError('FORBIDDEN');
    if (!config.statuses.some(s => s.code === input.status) || (input.position && !config.positions.some(p => p.code === input.position))) throw new DirectoryError('INVALID');
    if (new Set(input.organizationIds).size !== input.organizationIds.length || input.organizationIds.some(orgId => !state.organizations.some(org => org.id === orgId && org.churchId === actor.churchId))) throw new DirectoryError('INVALID');
  };
  const record = (actor: Actor, memberId: string, action: Audit['action'], fields: string[] = []) => {
    state.audits.push({ id: id(), churchId: actor.churchId, actorId: actor.id, memberId, action, fields, at: now() });
  };
  const summary = (member: Member) => ({ id: member.id, name: member.name, status: member.status, position: member.position, organizationIds: [...member.organizationIds], createdAt: member.createdAt });
  return {
    config(actor: Actor) {
      const config = church(actor);
      return structuredClone({ ...config, organizations: state.organizations.filter(org => org.churchId === actor.churchId && (actor.role !== 'LEADER' || actor.organizationIds.includes(org.id))) });
    },
    list(actor: Actor, raw: unknown = {}) {
      church(actor);
      const query = memberSearchSchema.parse(raw);
      const rows = state.members.filter(member => visible(actor, member) && member.name.includes(query.q) && (!query.status || member.status === query.status) && (!query.organizationId || member.organizationIds.includes(query.organizationId)))
        .sort((a, b) => a.name.localeCompare(b.name, 'ko') || a.id.localeCompare(b.id));
      const pageSize = 12;
      return { items: rows.slice((query.page - 1) * pageSize, query.page * pageSize).map(summary), total: rows.length, page: query.page, pageSize };
    },
    overview(actor: Actor) {
      church(actor);
      const rows = state.members.filter(member => visible(actor, member));
      return { total: rows.length, unassigned: rows.filter(m => !m.organizationIds.length).length, statuses: church(actor).statuses.map(s => ({ ...s, count: rows.filter(m => m.status === s.code).length })), recent: [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id)).slice(0, 5).map(summary) };
    },
    detail(actor: Actor, memberId: string) {
      const member = find(actor, memberId);
      record(actor, member.id, 'READ');
      const basic = { ...summary(member), version: member.version, updatedAt: member.updatedAt };
      if (actor.role === 'LEADER') return { ...basic, privateProfile: null, family: null, history: [] };
      const family = state.families.find(f => f.churchId === actor.churchId && f.members.some(m => m.memberId === memberId));
      return {
        ...basic, privateProfile: { phone: member.phone, address: member.address },
        family: family ? { name: family.name, members: family.members.flatMap(link => { const related = state.members.find(m => m.id === link.memberId && m.churchId === actor.churchId); return related ? [{ id: related.id, name: related.name, relationship: link.relationship }] : []; }) } : null,
        history: structuredClone(state.audits.filter(a => a.churchId === actor.churchId && a.memberId === memberId && a.action !== 'READ').slice(-30).reverse()),
      };
    },
    create(actor: Actor, raw: unknown) {
      const input = memberInputSchema.parse(raw); allowedInput(actor, input);
      const time = now();
      const member: Member = { ...input, id: id(), churchId: actor.churchId, version: 1, createdAt: time, updatedAt: time };
      state.members.push(member); record(actor, member.id, 'CREATE', Object.keys(input));
      return { id: member.id, version: member.version };
    },
    update(actor: Actor, memberId: string, raw: unknown) {
      const { version, ...input } = memberUpdateSchema.parse(raw);
      allowedInput(actor, input);
      const member = find(actor, memberId);
      if (member.version !== version) throw new DirectoryError('CONFLICT');
      const fields = (Object.keys(input) as (keyof MemberInput)[]).filter(key => JSON.stringify(input[key]) !== JSON.stringify(member[key]));
      Object.assign(member, input, { version: version + 1, updatedAt: now() });
      record(actor, member.id, 'UPDATE', fields);
      return { id: member.id, version: member.version };
    },
  };
}
