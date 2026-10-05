import { monthDates, eventOnDay } from '../packages/contracts/src/features/calendar';
import { createGroupPreview } from './preview-groups';
// Development-only, loopback-only, volatile fixtures. Never import from an app or deploy.
import { randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { careCreateSchema, defaultPreferences, emailSchema, preferenceInputSchema, resetPasswordSchema, signupSchema, type CareRequest, type MemberNotification, type NotificationPreferences } from '../packages/contracts/src/features/member/extras';
import { memberRecordInputSchema, memberRecordListSchema, type MemberRecord } from '../packages/contracts/src/features/member/records';
import { personalScheduleSchema, memberScheduleInputSchema as scheduleCreateSchema } from '../packages/contracts/src/features/member/schedules';
import { bookmarkListSchema } from '../packages/contracts/src/features/member/bookmarks';

export const previewPolicy = { version: 'preview-only-v1', terms: '개발용 체험 안내입니다. 실제 교회 이용약관이 아닙니다. 가상의 정보만 입력하세요.', privacy: '입력은 이 PC의 테스트 서버 메모리에서만 사용하며 서버를 종료하면 사라집니다. 실제 이름·연락처·개인적인 이야기를 입력하지 마세요.', care: '테스트 접수입니다. 실제 담당자는 없으며 교회로 전달되지 않습니다. 운영 열람 범위와 보관 기준은 미정입니다.', deletion: '테스트 계정과 이 서버 메모리의 연결된 테스트 기록을 삭제합니다. 실제 회원 탈퇴 정책이 아닙니다.' };
type Account = { id: string; email: string; displayName: string; passwordHash: Buffer; salt: string; verified: boolean; consentVersion: string | null; version: number };
type Fixture = Record<string, unknown> & { id: string };
type Owned = { records: Map<string, MemberRecord>; bookmarks: Map<string, Fixture>; schedules: Map<string, Fixture>; requests: Map<string, CareRequest>; keys: Map<string, { id: string; fingerprint: string }>; notifications: Map<string, MemberNotification>; preferences: NotificationPreferences };
export function createPreviewMembers(content: { worship: Fixture[]; events: Fixture[] }, now = () => Date.now()) {
  const groupPreview = createGroupPreview();
  const accounts = new Map<string, Account>(); const sessions = new Map<string, { owner: string; expires: number; refresh: string }>(); const owners = new Map<string, Owned>();
  const challenges = new Map<string, { expires: number; attempts: number }>(); const sends = new Map<string, number>();
  const iso = () => new Date(now()).toISOString();
  function newAccount(email: string, password: string, verified: boolean, displayName = '테스트 회원', consentVersion: string | null = null) {
    const salt = randomUUID(); const user = { id: randomUUID(), email, displayName, salt, passwordHash: scryptSync(password, salt, 32), verified, consentVersion, version: 1 }; accounts.set(email, user); return user;
  }
  newAccount('demo@example.invalid', 'Demo-only-123!', true);
  newAccount('other@example.invalid', 'Demo-only-123!', true);
  function owns(owner: string) {
    let data = owners.get(owner); if (data) return data;
    data = { records: new Map(), bookmarks: new Map(), schedules: new Map(), requests: new Map(), keys: new Map(), notifications: new Map(), preferences: { ...defaultPreferences } };
    data.notifications.set('welcome', { id: 'welcome', category: 'NEWS', title: '[샘플] 알림센터 체험', body: '실제 발송된 알림이 아닙니다. 읽음 표시와 필터를 확인할 수 있습니다.', createdAt: iso(), readAt: null, target: null });
    const word = content.worship[0]; if (word) data.notifications.set('word', { id: 'word', category: 'WORD', title: '[샘플] 첫시간 주님께', body: '샘플 말씀으로 이동합니다.', createdAt: iso(), readAt: null, target: { kind: 'devotional', id: word.id } });
    owners.set(owner, data); return data;
  }
  const authUser = (user: Account) => ({ id: user.id, email: user.email, aud: 'authenticated', role: 'authenticated', email_confirmed_at: user.verified ? iso() : null, app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: { display_name: user.displayName }, created_at: iso(), is_anonymous: false });
  const passwordMatches = (account: Account, password: string) => timingSafeEqual(account.passwordHash, scryptSync(password, account.salt, 32));
  function issue(user: Account) {
    const token = [Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url'), Buffer.from(JSON.stringify({ sub: user.id, aud: 'authenticated', exp: Math.floor(now() / 1000) + 3600, jti: randomUUID() })).toString('base64url'), 'preview-only-not-a-real-signature'].join('.');
    const refresh = randomUUID(); sessions.set(token, { owner: user.id, expires: now() + 3600000, refresh });
    return { access_token: token, refresh_token: refresh, expires_in: 3600, token_type: 'bearer', user: authUser(user) };
  }
  function challenge(email: string, purpose: string) {
    const key = `${purpose}:${email}`;
    if ((sends.get(key) ?? 0) + 1000 > now()) throw new PreviewError(429);
    sends.set(key, now()); challenges.set(key, { expires: now() + 10 * 60000, attempts: 0 });
  }
  function verify(email: string, purpose: string, code: string) {
    const key = `${purpose}:${email}`; const item = challenges.get(key);
    if (!item || item.expires < now() || item.attempts >= 5) throw new PreviewError(422);
    item.attempts++; if (code !== '123456') throw new PreviewError(422);
    challenges.delete(key);
  }
  return async function handle(request: Request): Promise<Response | null> {
    const url = new URL(request.url); if (url.pathname !== '/api/v1/groups' && !url.pathname.startsWith('/api/v1/me/') && !url.pathname.startsWith('/api/v1/account/') && !url.pathname.startsWith('/auth/v1/')) return null;
    const headers = new Headers({ 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', Vary: 'Origin' });
    const reply = (value: unknown, status = 200) => new Response(status === 204 ? null : JSON.stringify(value), { status, headers });
    const origin = request.headers.get('Origin');
    if (!['127.0.0.1', 'localhost'].includes(url.hostname) || (origin && !['http://localhost:8088', 'http://127.0.0.1:8088', 'http://localhost:8089', 'http://127.0.0.1:8089'].includes(origin))) return reply({}, 403);
    if (origin) headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type, apikey, x-client-info, x-supabase-api-version'); headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    if (request.method === 'OPTIONS') return reply(null, 204);
    try {
      let input: Record<string, unknown> = {};
      if (!['GET', 'HEAD'].includes(request.method)) {
        const text = await request.text(); if (Buffer.byteLength(text, 'utf8') > 262144) return reply({}, 413);
        input = text ? JSON.parse(text) : {};
      }
      const path = url.pathname; const method = request.method;
      if (path === '/api/v1/groups') { if (method !== 'GET') return reply({}, 405); const value = groupPreview.snapshot('', ''); return reply({ data: { groups: value.groups, notices: value.notices } }); }
      if (path === '/api/v1/account/options' && method === 'GET') return reply({ mode: 'preview', registration: true, recovery: true, care: true, notifications: true, deletion: true, policy: previewPolicy });
      if (path.startsWith('/api/v1/account/')) {
        if (method !== 'POST') return reply({}, 405);
        const email = emailSchema.parse(input.email).toLowerCase();
        // Prevent mistaken use of real addresses in the explicitly local test service.
        if (!email.endsWith('@example.invalid')) return reply({ error: 'Use a fictional @example.invalid address.' }, 422);
        const account = accounts.get(email);
        if (path.endsWith('/signup')) { const data = signupSchema.parse(input); if (data.policyVersion !== previewPolicy.version) return reply({}, 409); if (!account) newAccount(email, data.password, false, data.displayName, data.policyVersion); challenge(email, 'signup'); return reply({ accepted: true }); }
        if (path.endsWith('/resend')) { challenge(email, 'signup'); return reply({ accepted: true }); }
        if (path.endsWith('/verify')) { verify(email, 'signup', z.string().parse(input.code)); if (account) account.verified = true; return reply({ verified: true }); }
        if (path.endsWith('/recovery')) { challenge(email, 'recovery'); return reply({ accepted: true }); }
        if (path.endsWith('/reset')) { const data = resetPasswordSchema.parse(input); verify(email, 'recovery', data.code); if (account) { account.passwordHash = scryptSync(data.password, account.salt, 32); for (const [token, session] of sessions) if (session.owner === account.id) sessions.delete(token); } return reply({ updated: true }); }
        return reply({}, 404);
      }
      if (path === '/auth/v1/token' && method === 'POST') {
        let user: Account | undefined;
        if (url.searchParams.get('grant_type') === 'refresh_token') {
          const entry = [...sessions.entries()].find(([, session]) => session.refresh === input.refresh_token);
          user = entry && [...accounts.values()].find(account => account.id === entry[1].owner); if (entry) sessions.delete(entry[0]);
        } else { user = accounts.get(String(input.email).trim().toLowerCase()); if (user && !passwordMatches(user, z.string().max(128).parse(input.password))) user = undefined; }
        if (!user?.verified) return reply({ error_code: 'invalid_credentials', msg: 'Invalid login credentials' }, 400);
        return reply(issue(user));
      }
      const token = request.headers.get('Authorization')?.replace(/^Bearer /, '') ?? ''; const session = sessions.get(token);
      if (!session || session.expires <= now()) return reply({}, 401);
      const user = [...accounts.values()].find(account => account.id === session.owner); if (!user) return reply({}, 401);
      if (path === '/auth/v1/logout' && method === 'POST') { sessions.delete(token); return reply(null, 204); }
      if (path === '/auth/v1/user' && method === 'GET') return reply(authUser(user));
      const data = owns(user.id); const [, resource, id] = path.match(/^\/api\/v1\/me\/([^/]+)(?:\/([^/]+))?$/) ?? [];
      if (resource === 'groups' && !id) {
        if (method === 'GET') return reply({ data: groupPreview.snapshot(user.id, user.email) });
        if (method === 'PATCH') { const result = groupPreview.update(user.id, user.email, input); return reply({ data: result.data }, result.status); }
        return reply({}, 405);
      }
      const page = z.coerce.number().int().min(0).max(10000).parse(url.searchParams.get('page') ?? 0);
      const paginate = <T>(rows: T[]) => ({ data: rows.slice(page * 20, page * 20 + 20), nextPage: rows.length > (page + 1) * 20 ? page + 1 : null });
      if (resource === 'profile' && !id) {
        const profile = () => ({ email: user.email, displayName: user.displayName, consentVersion: user.consentVersion, version: user.version });
        if (method === 'GET') return reply({ data: profile() });
        if (method === 'PATCH') { const edit = z.object({ displayName: z.string().trim().max(40), version: z.number().int() }).strict().parse(input); if (edit.version !== user.version) return reply({}, 409); user.displayName = edit.displayName; user.version++; return reply({ data: profile() }); }
        if (method === 'DELETE') { const deletion = z.object({ password: z.string().max(128), policyVersion: z.literal(previewPolicy.version), confirm: z.literal('DELETE') }).strict().parse(input); if (!passwordMatches(user, deletion.password)) return reply({}, 422); accounts.delete(user.email); owners.delete(user.id); groupPreview.remove(user.id); for (const [key, value] of sessions) if (value.owner === user.id) sessions.delete(key); return reply(null, 204); }
      }
      if (resource === 'preferences' && !id) {
        if (method === 'GET') return reply({ data: data.preferences });
        if (method === 'PATCH') { if (input.version !== data.preferences.version) return reply({}, 409); data.preferences = { ...preferenceInputSchema.parse(input.content), version: data.preferences.version + 1 }; return reply({ data: data.preferences }); }
      }
      if (resource === 'notifications') {
        const row = id ? data.notifications.get(id) : undefined;
        if (id && !row) return reply({}, 404);
        if (method === 'GET') return reply(row ? { data: row } : paginate([...data.notifications.values()].filter(item => !url.searchParams.get('category') || url.searchParams.get('category') === 'ALL' || item.category === url.searchParams.get('category'))));
        if (method === 'PATCH' && row) { z.object({ read: z.literal(true) }).strict().parse(input); row.readAt ??= iso(); return reply({ data: row }); }
      }
      if (resource === 'requests') {
        const row = id ? data.requests.get(id) : undefined;
        if (id && !row) return reply({}, 404);
        if (method === 'GET') return reply(row ? { data: row } : paginate([...data.requests.values()].reverse()));
        if (method === 'POST' && !id) {
          const parsed = careCreateSchema.parse(input); if (parsed.policyVersion !== previewPolicy.version) return reply({}, 409);
          const fingerprint = JSON.stringify(parsed.content); const previous = data.keys.get(parsed.requestKey);
          if (previous) return previous.fingerprint === fingerprint ? reply({ data: data.requests.get(previous.id) }) : reply({}, 409);
          const item: CareRequest = { id: randomUUID(), content: parsed.content, status: 'RECEIVED', version: 1, createdAt: iso(), updatedAt: iso() }; data.requests.set(item.id, item); data.keys.set(parsed.requestKey, { id: item.id, fingerprint }); return reply({ data: item }, 201);
        }
        if (method === 'PATCH' && row) { z.object({ action: z.literal('CANCEL'), version: z.number().int() }).strict().parse(input); if (input.version !== row.version || ['COMPLETED', 'CANCELLED'].includes(row.status)) return reply({}, 409); row.status = 'CANCELLED'; row.version++; row.updatedAt = iso(); return reply({ data: row }); }
      }
      if (resource === 'records') {
        const row = id ? data.records.get(id) : undefined; if (id && !row) return reply({}, 404);
        if (method === 'GET') { const query = memberRecordListSchema.parse(Object.fromEntries(url.searchParams)); return reply(row ? { data: row } : paginate([...data.records.values()].reverse().filter(item => (!query.kind || item.content.kind === query.kind) && (!query.month || item.content.date?.startsWith(query.month)) && (!query.date || item.content.date === query.date) && (!query.worshipId || (item.content.kind === 'REFLECTION' && item.content.worship.id === query.worshipId)) && (!query.reflectionId || (item.content.kind !== 'REFLECTION' && item.content.reflectionId === query.reflectionId))))); }
        if (method === 'POST' || method === 'PATCH') {
          const value = memberRecordInputSchema.parse(method === 'POST' ? input : input.content);
          if (row && (row.version !== input.version || row.content.kind !== value.kind)) return reply({}, 409);
          if (value.kind === 'REFLECTION') { const word = content.worship.find(item => item.id === value.worship.id); if (!word) return reply({}, 404); value.worship = { id: word.id, version: Number(word.version), title: String(word.title), contentDate: String(word.contentDate), scriptureReference: typeof word.scriptureReference === 'string' ? word.scriptureReference : null }; }
          else if (value.reflectionId && data.records.get(value.reflectionId)?.content.kind !== 'REFLECTION') return reply({}, 404);
          const item = { id: row?.id ?? randomUUID(), content: value, version: (row?.version ?? 0) + 1, createdAt: row?.createdAt ?? iso(), updatedAt: iso() }; data.records.set(item.id, item); return reply({ data: method === 'POST' ? item : { id: item.id, version: item.version } }, method === 'POST' ? 201 : 200);
        }
        if (method === 'DELETE' && row) { if (input.version !== row.version) return reply({}, 409); data.records.delete(row.id); return reply(null, 204); }
      }
      if (resource === 'bookmarks') {
        const row = id ? data.bookmarks.get(id) : undefined; if (id && !row) return reply({}, 404);
        if (method === 'GET') { const query = bookmarkListSchema.parse(Object.fromEntries(url.searchParams)); return reply(row ? { data: row } : paginate([...data.bookmarks.values()].filter(item => { const type = (item.worship as Fixture).type; const group = type === 'FIRST_HOUR' ? 'devotional' : ['SUNDAY_MORNING', 'SUNDAY_AFTERNOON', 'WEDNESDAY'].includes(String(type)) ? 'sermon' : 'other'; return (!query.worshipId || item.worshipId === query.worshipId) && (query.group === 'all' || query.group === group); }))); }
        if (method === 'POST' && !id) { const word = content.worship.find(item => item.id === input.worshipId); if (!word) return reply({}, 404); const item = [...data.bookmarks.values()].find(item => item.worshipId === word.id) ?? { id: randomUUID(), worshipId: word.id, createdAt: iso(), worship: word }; data.bookmarks.set(item.id, item); return reply({ data: item }, 201); }
        if (method === 'DELETE' && row) { data.bookmarks.delete(row.id); return reply(null, 204); }
      }
      if (resource === 'schedules') {
        const row = id ? data.schedules.get(id) : undefined; if (id && !row) return reply({}, 404);
        if (method === 'GET') return reply(row ? { data: row } : paginate([...data.schedules.values()].filter(item => { const value = item.content as { startDate: string; endDate: string } | null; const date = url.searchParams.get('date'); const event = item.event as { startsAt: string; endsAt: string | null } | null; const day = (time: string) => new Date(new Date(time).getTime() + 9 * 3600000).toISOString().slice(0, 10); const inDay = !date || (value ? value.startDate <= date && value.endDate >= date : !!event && day(event.startsAt) <= date && day(event.endsAt ?? event.startsAt) >= date); return (!url.searchParams.get('eventId') || item.eventId === url.searchParams.get('eventId')) && inDay && (!url.searchParams.get('month') || monthDates(url.searchParams.get('month')!).some(day => value ? value.startDate <= day && value.endDate >= day : !!event && eventOnDay({ ...event, isAllDay: !!(item.event as Fixture)?.isAllDay }, day))); })));
        if (method === 'POST' && !id) { const value = scheduleCreateSchema.parse(input); const event = value.kind === 'CHURCH' ? content.events.find(item => item.id === value.eventId) : null; if (value.kind === 'CHURCH' && !event) return reply({}, 404); const previous = event ? [...data.schedules.values()].find(item => item.eventId === event.id) : null; const item = previous ?? { id: randomUUID(), version: 1, content: value.kind === 'PERSONAL' ? value : null, eventId: event?.id ?? null, event }; data.schedules.set(item.id, item); return reply({ data: item }, 201); }
        if (method === 'PATCH' && row) { if (input.version !== row.version || row.eventId) return reply({}, 409); row.content = personalScheduleSchema.parse(input.content); row.version = Number(row.version) + 1; return reply({ data: { id: row.id, version: row.version } }); }
        if (method === 'DELETE' && row) { if (input.version !== row.version) return reply({}, 409); data.schedules.delete(row.id); return reply(null, 204); }
      }
      return reply({}, 405);
    } catch (error) { return reply({ error: 'Invalid test request' }, error instanceof PreviewError ? error.status : error instanceof z.ZodError || error instanceof SyntaxError ? 422 : 503); }
  };
}
class PreviewError extends Error { constructor(public status: number) { super('Preview request failed'); } }
