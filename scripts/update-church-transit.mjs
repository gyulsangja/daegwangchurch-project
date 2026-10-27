// Public directions verified against the church site and Geumcheon-gu guidance, 2026-10-27.
// https://daegwangchurch.smartchurch.net/
// https://m.geumcheon.go.kr/health/contents.do?key=4444
// Run: node --conditions=react-server --import tsx scripts/update-church-transit.mjs [--apply]
// Dry run by default; --apply changes only contactOptions.transitInfo.
import { mkdir, writeFile } from 'node:fs/promises';
process.loadEnvFile('apps/admin/.env.local');
const { getPrisma } = await import('@daegwang/database/prisma');
const db = getPrisma();
const transitInfo = `지하철에서 버스로 환승
2호선 구로디지털단지역에서 독산동 방면 507·5620·5633번 버스로 환승한 뒤, ‘독산동남문시장’ 정류장에서 내려 주세요. 승차 전 버스의 진행 방향과 정차 정류장을 확인해 주세요.

버스로 오시는 경우
하차 정류장: 독산동남문시장
간선버스: 507번
지선버스: 5413·5525·5619·5620·5633·6516번

하차 후 교회 찾기
목적지는 서울 금천구 독산로 299, 대광아파트 지하 1층 대광교회입니다. 하차한 정류장 쪽에 따라 도로를 건너야 할 수 있으니 인근 횡단보도를 이용해 주세요. ‘남문시장입구’ 등 비슷한 이름의 정류장과 구분해 주세요.

지도 앱에서 아래 주소를 목적지로 대중교통 경로를 검색해 주세요.
서울 금천구 독산로 299
길을 찾기 어려우시면 교회 대표전화 02-857-0191로 문의해 주세요.

2026.10.27 확인 · 버스 노선과 운행 상황은 달라질 수 있으므로 출발 전에 지도 앱에서 확인해 주세요.`;
try {
  const row = await db.siteSetting.findUnique({ where: { singletonKey: 'SITE' } });
  if (!row || !row.address?.includes('독산로 299')) throw new Error('Unexpected church address; no changes made.');
  const options = row.contactOptions && typeof row.contactOptions === 'object' && !Array.isArray(row.contactOptions) ? row.contactOptions : {};
  console.log(JSON.stringify({ address: row.address, addressDetail: row.addressDetail, phone: row.phone, previousTransit: options.transitInfo, nextTransit: transitInfo }, null, 2));
  if (options.transitInfo === transitInfo) console.log('Already up to date.');
  else if (process.argv.includes('--apply')) {
    await mkdir('.local/transit-backups', { recursive: true });
    await writeFile(`.local/transit-backups/${Date.now()}.json`, JSON.stringify({ id: row.id, updatedAt: row.updatedAt, contactOptions: row.contactOptions }, null, 2));
    const result = await db.siteSetting.updateMany({ where: { id: row.id, updatedAt: row.updatedAt }, data: { contactOptions: { ...options, transitInfo } } });
    if (result.count !== 1) throw new Error('Settings changed concurrently; reload before trying again.');
    console.log('Updated shared website/app transit directions.');
  } else console.log('Dry run only.');
} finally { await db.$disconnect(); }
