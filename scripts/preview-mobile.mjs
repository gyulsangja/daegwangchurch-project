import { monthDates, eventOnDay } from '../packages/contracts/src/features/calendar.ts';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { sampleBulletinPdf } from './sample-bulletin.mjs';
import { createPreviewMembers } from './preview-members.ts';

// Local sample API with volatile member fixtures. No database or administrator credentials are used.
const items = [
  { id: 'preview-1', title: '[샘플] 내 안에 거하라', contentDate: '2026-10-02', scriptureReference: '요한복음 15:1–8' },
  { id: 'preview-2', title: '[샘플] 하루를 주님께 맡기며', contentDate: '2026-10-01', scriptureReference: '잠언 3:5–6' },
  { id: 'preview-3', title: '[샘플] 감사로 시작하는 아침', contentDate: '2026-09-30', scriptureReference: '시편 100:4' },
].map((item) => ({
  ...item, version: 1, type: 'FIRST_HOUR', preacher: null, sermonTitle: null,
  youtube: { videoId: 'T0000000001', url: 'https://www.youtube.com/watch?v=T0000000001', thumbnailUrl: null },
  description: '화면 확인용 샘플 콘텐츠입니다. 실제 교회 말씀이나 발행 데이터가 아닙니다. 영상은 연결되지 않아 재생되지 않습니다.',
  summary: '묵상 목록에서 상세 화면을 열고, 본문 위치와 설명을 확인할 수 있습니다.',
}));
items.push(...[
  { id: 'sermon-preview-1', type: 'SUNDAY_MORNING', title: '[샘플] 믿음으로 걷는 길', contentDate: '2026-10-04', scriptureReference: '요한복음 15:1–8' },
  { id: 'sermon-preview-2', type: 'SPECIAL', title: '[샘플] 함께 드리는 감사', contentDate: '2026-10-03', scriptureReference: '시편 100:4' },
].map(item => ({ ...items[0], ...item, preacher: '샘플 설교자' })));

const notices = [
  { id: 'notice-preview-1', title: '[샘플] 주요 공지', isPinned: true, body: '공지 상세 화면 확인용 샘플입니다.\n실제 교회 공지나 행사 안내가 아닙니다.' },
  { id: 'notice-preview-2', title: '[샘플] 이번 주 교회 소식', isPinned: false, body: '관리자가 공개한 공지 본문을 이 화면에서 읽게 됩니다.\n현재는 데이터 연결 없이 화면만 확인하고 있습니다.' },
].map(item => ({ ...item, category: '교회 안내', isImportant: false, publishedAt: '2026-10-04T00:00:00.000Z', updatedAt: '2026-10-04T00:00:00.000Z', attachmentCount: 0, attachments: [] }));

const pdf = sampleBulletinPdf();
const prayers = [{ ...notices[0], id: 'prayer-preview-1', title: '[샘플] 함께 드리는 기도', category: '공동기도', body: '공동기도 화면 확인용 샘플입니다. 실제 교회가 작성한 기도문이 아닙니다.' }];
const events = [
  { id: 'event-preview-1', title: '[샘플] 함께하는 교회 모임', startsAt: new Date(Date.now() + 7 * 86400000).toISOString(), endsAt: null, isAllDay: false },
  { id: 'event-preview-2', title: '[샘플] 지난 교회 모임', startsAt: new Date(Date.now() - 7 * 86400000).toISOString(), endsAt: null, isAllDay: true },
].map(item => ({ ...item, category: '샘플', location: '샘플 장소', ministryName: null, description: '화면 확인용 샘플 행사입니다. 실제 교회 일정이 아닙니다.\n일시와 장소는 실제 자료 연결 후 표시됩니다.' }));
const bulletins = ['2026-10-04', '2026-09-27'].map((date, index) => ({ id: `bulletin-preview-${index + 1}`, title: `[샘플] ${date} 주보`, worshipDate: `${date}T00:00:00.000Z`, summary: '화면 확인용 샘플이며 실제 교회 주보가 아닙니다.', pdf: { name: 'sample-bulletin.pdf', sizeBytes: pdf.length, url: 'http://127.0.0.1:3210/sample-bulletin.pdf' } }));
const members = createPreviewMembers({ worship: items, events });
const api = createServer(async (request, response) => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  const url = new URL(request.url, 'http://127.0.0.1:3210');
  if (url.pathname === '/api/v1/groups' || /^\/(?:auth\/v1\/|api\/v1\/(?:account|me)\/)/.test(url.pathname)) {
    try {
      const chunks = []; let size = 0;
      for await (const chunk of request) { size += chunk.length; if (size > 262144) { response.writeHead(413).end('{}'); return; } chunks.push(chunk); }
      if (!['127.0.0.1:3210', 'localhost:3210'].includes(request.headers.host)) { response.writeHead(403).end('{}'); return; }
      const result = await members(new Request(url, { method: request.method, headers: Object.fromEntries(Object.entries(request.headers).filter(([, value]) => typeof value === 'string')), body: ['GET', 'HEAD'].includes(request.method) ? undefined : Buffer.concat(chunks) }));
      if (!result) { response.writeHead(404).end('{}'); return; }
      response.removeHeader('Access-Control-Allow-Origin'); for (const [key, value] of result.headers) response.setHeader(key, value);
      response.writeHead(result.status).end(Buffer.from(await result.arrayBuffer()));
    } catch { response.writeHead(503).end('{}'); }
    return;
  }
  if (request.method !== 'GET') {
    response.writeHead(405).end('{}'); return;
  }
  if (url.pathname === '/sample-bulletin.pdf') { response.setHeader('Content-Type', 'application/pdf'); response.end(pdf); return; }
  if (url.pathname === '/api/v1/prayers') { response.end(JSON.stringify({ data: prayers, nextPage: null })); return; }
  if (url.pathname.startsWith('/api/v1/prayers/')) {
    const prayer = prayers.find(item => url.pathname === `/api/v1/prayers/${item.id}`);
    response.writeHead(prayer ? 200 : 404).end(JSON.stringify(prayer ? { data: prayer } : { error: { message: '샘플 공동기도를 찾을 수 없습니다.' } })); return;
  }
  if (url.pathname === '/api/v1/church/about') {
    response.end(JSON.stringify({ data: { title: '[샘플] 교회 소개', content: { heroTitle: '교회 소개 화면 미리보기', heroDescription: '관리자가 공개한 교회 소개를 이곳에서 읽을 수 있습니다.', sinceLabel: '', motto: '', sectionTitle: '', body: '현재 내용은 화면 확인용 샘플이며 공식 교회 소개 자료가 아닙니다.', values: [] } } })); return;
  }
  if (url.pathname === '/api/v1/church/pastor') {
    response.end(JSON.stringify({ data: { name: '[샘플] 목회자 소개', position: '담임목사', introduction: '공식 목회자 소개 자료 연결 전 화면 확인용 샘플입니다.', quote: null, career: ['실제 성함과 약력은 관리자 공개 자료에서 불러옵니다.'], imageUrl: null } })); return;
  }
  if (url.pathname === '/api/v1/church/newcomer') {
    response.end(JSON.stringify({ data: { title: '[샘플] 새가족안내', content: { heroTitle: '[샘플] 처음 오셨나요?', heroDescription: '화면 확인용 샘플입니다. 공식 안내가 아닙니다.', processTitle: '안내 절차 미리보기', duration: '', location: '', leader: '', applicationInfo: '실제 안내 절차는 관리자 공개 자료에서 불러옵니다.', steps: [] } } })); return;
  }
  if (url.pathname === '/api/v1/church/contact') {
    response.end(JSON.stringify({ data: { siteName: '[샘플] 교회 연락처', address: '', addressDetail: '', phone: '', email: '', websiteUrl: null, latitude: null, longitude: null, transitInfo: '샘플 화면입니다. 실제 주소·교통 정보는 아직 연결하지 않았습니다.', parkingInfo: '' } })); return;
  }
  if (url.pathname === '/api/v1/church/schedules') {
    response.end(JSON.stringify({ data: [
      { id: 'schedule-preview-1', name: '[샘플] 주일예배', dayLabel: '주일', timeLabel: '시간 확인용 샘플', location: '샘플 장소', note: '실제 예배 시간·장소가 아닙니다.' },
      { id: 'schedule-preview-2', name: '[샘플] 주중예배', dayLabel: '수요일', timeLabel: '시간 확인용 샘플', location: '샘플 장소', note: '공식 시간표 연결 후 표시됩니다.' },
    ] })); return;
  }
  if (url.pathname === '/api/v1/events') {
    const date = url.searchParams.get('date');
    response.end(JSON.stringify({ data: Number(url.searchParams.get('page')) > 0 ? [] : events.filter(item => url.searchParams.get('month') ? monthDates(url.searchParams.get('month')).some(day => eventOnDay(item, day)) : date ? new Date(new Date(item.startsAt).getTime() + 9 * 3600000).toISOString().slice(0, 10) === date : (new Date(item.startsAt).getTime() < Date.now()) === (url.searchParams.get('period') === 'past')), nextPage: null })); return;
  }
  if (url.pathname.startsWith('/api/v1/events/')) {
    const event = events.find(item => url.pathname === `/api/v1/events/${item.id}`);
    response.writeHead(event ? 200 : 404).end(JSON.stringify(event ? { data: event } : { error: { message: '샘플 행사를 찾을 수 없습니다.' } })); return;
  }
  if (url.pathname === '/api/v1/bulletins') {
    const month = url.searchParams.get('month');
    response.end(JSON.stringify({ data: Number(url.searchParams.get('page')) > 0 ? [] : bulletins.filter(item => !month || item.worshipDate.startsWith(month)), nextPage: null })); return;
  }
  if (url.pathname.startsWith('/api/v1/bulletins/')) {
    const bulletin = bulletins.find(item => url.pathname === `/api/v1/bulletins/${item.id}`);
    response.writeHead(bulletin ? 200 : 404).end(JSON.stringify(bulletin ? { data: bulletin } : { error: { message: '샘플 주보를 찾을 수 없습니다.' } })); return;
  }
  if (url.pathname === '/api/v1/worship') {
    const month = url.searchParams.get('month');
    const param = key => url.searchParams.get(key);
    const contains = (value, search) => !search || (value ?? '').toLowerCase().includes(search.toLowerCase());
    response.end(JSON.stringify({ data: items.filter(item => (!month || item.contentDate.startsWith(month)) && (!param('type') || item.type === param('type'))
      && (!param('group') || (param('group') === 'sunday' ? ['SUNDAY_MORNING', 'SUNDAY_AFTERNOON'].includes(item.type) : param('group') === 'special' ? ['WEDNESDAY', 'SPECIAL', 'PRAISE'].includes(item.type) : item.type !== 'FIRST_HOUR'))
      && (!param('q') || ['title', 'sermonTitle', 'scriptureReference', 'preacher'].some(key => contains(item[key], param('q'))))
      && contains(item.preacher, param('preacher')) && contains(item.scriptureReference, param('scripture'))
      && (!param('from') || item.contentDate >= param('from')) && (!param('to') || item.contentDate <= param('to'))), nextCursor: null }));
    return;
  }
  if (url.pathname === '/api/v1/notices') {
    response.end(JSON.stringify({ data: url.searchParams.get('page') > 0 ? [] : notices, nextPage: null })); return;
  }
  if (url.pathname.startsWith('/api/v1/notices/')) {
    const notice = notices.find(entry => url.pathname === `/api/v1/notices/${entry.id}`);
    response.writeHead(notice ? 200 : 404).end(JSON.stringify(notice ? { data: notice } : { error: { message: '샘플 공지를 찾을 수 없습니다.' } })); return;
  }
  const item = items.find((entry) => url.pathname === `/api/v1/worship/${entry.id}`);
  response.writeHead(item ? 200 : 404).end(JSON.stringify(item ? { data: item } : { error: { message: '샘플을 찾을 수 없습니다.' } }));
});

api.on('error', (error) => { console.error('Sample API could not start:', error.message); process.exitCode = 1; });
api.listen(3210, '127.0.0.1', () => {
  console.log('Local sample preview: http://localhost:8088. Fictional data only; no real emails, requests or push delivery. Test login: demo@example.invalid / Demo-only-123!');
  const app = spawn(process.execPath, [process.env.npm_execpath, 'run', 'web', '--workspace', '@daegwang/mobile', '--', '--port', '8088', '--max-workers', '2'], {
    stdio: 'inherit',
    env: { ...process.env, EXPO_PUBLIC_API_BASE_URL: 'http://127.0.0.1:3210', EXPO_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:3210', EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_preview_only', EXPO_PUBLIC_DEMO_MODE: 'true', EXPO_OFFLINE: '1' },
  });
  const stop = () => { app.kill(); api.close(); };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  app.once('error', (error) => { console.error(error.message); api.close(); process.exitCode = 1; });
  app.once('exit', (code) => { api.close(); process.exitCode = code ?? 0; });
});
