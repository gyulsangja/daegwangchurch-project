import { readFile, writeFile } from 'node:fs/promises';
process.loadEnvFile('apps/admin/.env.local');
const { getPrisma } = await import('@daegwang/database/prisma');
const db = getPrisma();
const apply = process.argv.includes('--apply');
const schedules = [
  ['주일 오전 예배', '주일', '오전 11:00', '본당'], ['주일 오후 예배', '주일', '오후 2:00', '본당'],
  ['수요기도회', '수요일', '저녁 7:00', '본당'], ['새벽기도회', '월요일–금요일', '오전 5:30', '본당'],
  ['유초등부 예배', '주일', '오전 9:40', '2층 교육관'], ['중고등부 예배', '주일', '오후 12:40', '2층 교육관'],
  ['청년부 예배', '주일', '오후 2:00', '본당'], ['새가족부', '요일 문의', '오후 12:30', '제1교육관'],
  ['목요성경공부', '목요일', '오후 2:00', '제2교육관'],
];
const ministries = [
  { name: '유초등부', slug: 'elementary', type: 'ELEMENTARY', introduction: '유초등부는 주일 오전 9시 40분, 2층 유초등부 교육관에서 함께 예배합니다.', audience: '어린이', meetingDay: '주일', meetingTime: '오전 9:40', location: '2층 유초등부 교육관', leader: '부장 오지훈 집사 · 교역자 오훈 목사' },
  { name: '중고등부', slug: 'youth', type: 'YOUTH', introduction: '중고등부는 주일 오후 12시 40분, 2층 중고등부 교육관에서 모입니다.', audience: '중·고등학생', meetingDay: '주일', meetingTime: '오후 12:40', location: '2층 중고등부 교육관', leader: '부장 김동하 집사 · 교역자 장경미 전도사' },
  { name: '청년부', slug: 'young-adult', type: 'YOUNG_ADULT', introduction: '청년부는 주일 오후 2시, 본당에서 함께 모입니다.', audience: '청년', meetingDay: '주일', meetingTime: '오후 2:00', location: '본당', leader: '부장 김범수 집사 · 교역자 오훈 목사' },
];
const people = JSON.parse(await readFile('test-results/legacy-people.json', 'utf8'));
const albums = JSON.parse(await readFile('test-results/content-import/legacy-albums.json', 'utf8'));
function day(text, fallback) {
  const match = text.match(/(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})/) || fallback.match(/(20\d{2})년 (\d{1,2})월 (\d{1,2})일/);
  if (!match) throw new Error('Source date missing');
  return new Date(`${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}T00:00:00.000Z`);
}
try {
  const before = { ministries: await db.ministry.findMany(), schedules: await db.worshipSchedule.findMany(), people: await db.person.findMany(), settings: await db.siteSetting.findUnique({ where: { singletonKey: 'SITE' } }), albums: await db.album.findMany() };
  if (!apply) { console.log({ apply: false, schedules: schedules.length, ministries: ministries.length, people: people.length, albums: albums.length, photos: albums.reduce((n, a) => n + a.images.length, people.length) }); process.exitCode = 0; }
  else {
    await writeFile(`test-results/content-import/backup-church-${Date.now()}.json`, JSON.stringify(before, null, 2));
    const jobs = [];
    await db.$transaction(async tx => {
      for (const [sortOrder, [name, dayLabel, timeLabel, location]] of schedules.entries()) {
        if (before.schedules.some(row => row.name === name)) continue;
        await tx.worshipSchedule.create({ data: { name, dayLabel, timeLabel, location, sortOrder, note: name === '새가족부' ? '모임 요일은 교회로 문의해 주세요.' : null } });
      }
      for (const [sortOrder, data] of ministries.entries()) {
        if (before.ministries.some(row => row.slug === data.slug)) continue;
        await tx.ministry.create({ data: { ...data, status: 'PUBLISHED', publishedAt: new Date(), sortOrder } });
      }
      for (const [sortOrder, item] of people.entries()) {
        const [name, position] = item.text.split(/\n+/);
        let person = before.people.find(row => row.name === name && row.position.replaceAll(' ', '') === position.replaceAll(' ', ''));
        if (!person) person = await tx.person.create({ data: { name, position: position === '원로 장로' ? '원로장로' : position, isSeniorPastor: position === '담임목사', sortOrder } });
        if (!person.profileImageId && item.images[0]) jobs.push({ type: 'person', id: person.id, source: new URL(item.images[0].src).searchParams.get('url'), alt: `${name} ${position}` });
      }
      for (const item of albums) {
        const slug = `smartchurch-${item.id}`; let album = before.albums.find(row => row.slug === slug);
        const lines = item.title.split(/\n+/).map(s => s.trim()).filter(Boolean);
        const title = /^20\d{2}[-/]\d/.test(lines[0]) && lines.length > 1 ? `${lines[0]} ${lines[1]}` : lines[0];
        if (!album) album = await tx.album.create({ data: { title: title.slice(0, 160), slug, eventDate: day(item.title, item.date), category: '교회 행사', description: lines.length > 1 ? item.title : null, status: 'PUBLISHED', publishedAt: day('', item.date), showOnMain: true } });
        for (const [sortOrder, source] of item.images.entries()) jobs.push({ type: 'album', id: album.id, source, sortOrder, alt: `${title} 사진 ${sortOrder + 1}` });
      }
      if (before.settings) {
        const options = before.settings.contactOptions || {};
        await tx.siteSetting.update({ where: { id: before.settings.id }, data: { phone: before.settings.phone || '02-857-0191', contactOptions: { ...options, transitInfo: options.transitInfo || '독산동 남문시장 정류장을 이용해 주세요.', offeringBank: options.offeringBank || '국민은행', offeringNumber: options.offeringNumber || '435001-01-444419', offeringHolder: options.offeringHolder || '대한예수교장로회 대광교회', offeringNote: options.offeringNote || '' } } });
      }
      await tx.activityLog.create({ data: { action: 'CREATE', entityType: 'LegacyImport', summary: '기존 스마트처치 홈페이지 공개 교회 안내·인물·앨범 이관', changes: { source: 'https://daegwangchurch.smartchurch.net/', schedules: schedules.length, ministries: ministries.length, people: people.length, albums: albums.length } } });
    }, { timeout: 30000 });
    await writeFile('test-results/content-import/photo-jobs.json', JSON.stringify(jobs, null, 2));
    console.log({ applied: true, photoJobs: jobs.length });
  }
} finally { await db.$disconnect(); }
