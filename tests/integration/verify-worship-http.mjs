import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import { resolve } from "node:path";
import { setTimeout } from "node:timers/promises";
import pg from "pg";

export async function verifyWorshipHttp(databaseUrl) {
  const reservation = createServer();
  reservation.listen(0, "127.0.0.1");
  await once(reservation, "listening");
  const port = reservation.address().port;
  await new Promise((done) => reservation.close(done));
  const server = spawn(process.execPath, [resolve("node_modules/next/dist/bin/next"), "start", "--hostname", "127.0.0.1", "--port", String(port)], {
    windowsHide: true, stdio: "ignore", cwd: resolve("apps/admin"),
    env: { ...process.env, DATABASE_URL: databaseUrl, DIRECT_URL: "", APP_PUBLICATION_ENABLED: "true" },
  });
  const siteReservation = createServer();
  siteReservation.listen(0, '127.0.0.1');
  await once(siteReservation, 'listening');
  const websitePort = siteReservation.address().port;
  await new Promise(done => siteReservation.close(done));
  const website = spawn(process.execPath, [resolve('node_modules/next/dist/bin/next'), 'start', '--hostname', '127.0.0.1', '--port', String(websitePort)], {
    windowsHide: true, stdio: 'ignore', cwd: resolve('apps/website'),
    env: { ...process.env, DATABASE_URL: databaseUrl, DIRECT_URL: '' },
  });
  const websiteBase = 'http://127.0.0.1:' + websitePort;
  const base = `http://127.0.0.1:${port}/api/v1/worship`;
  const client = new pg.Client({ connectionString: databaseUrl });
  try {
    let ready = false;
    for (let count = 0; count < 60; count++) {
      try {
        const response = await fetch(`${base}?limit=1`, { signal: AbortSignal.timeout(1500) });
        if (response.status === 200) { ready = true; break; }
      } catch { /* Startup may take a moment. */ }
      if (server.exitCode !== null) throw new Error("HTTP server exited");
      await setTimeout(500);
    }
    assert.ok(ready, "Production API must become ready");
    const list = await fetch(`${base}?limit=2`);
    const body = await list.json();
    assert.equal(list.status, 200);
    assert.equal(list.headers.get("cache-control"), "no-store");
    assert.equal(body.data.length, 2);
    assert.ok(body.nextCursor);
    const detail = await fetch(`${base}/${body.data[0].id}`);
    assert.equal(detail.status, 200);
    assert.deepEqual((await detail.json()).data, body.data[0]);
    const next = await (await fetch(`${base}?limit=2&cursor=${encodeURIComponent(body.nextCursor)}`)).json();
    assert.ok(next.data.every((item) => !body.data.some((first) => first.id === item.id)));
    await client.connect();
    const hidden = await client.query(`SELECT w.id FROM worship_contents w LEFT JOIN worship_publications p ON p."worshipContentId" = w.id AND p.channel = 'APP' WHERE p.id IS NULL LIMIT 1`);
    assert.ok(hidden.rows[0]);
    assert.equal((await fetch(`${base}/${hidden.rows[0].id}`)).status, 404);
    assert.equal((await fetch(`${base}?limit=999`)).status, 422);
    assert.equal((await fetch(`${base}?cursor=invalid`)).status, 422);
    assert.equal((await fetch(base, { method: "POST" })).status, 405);
    const homepage = await fetch(websiteBase);
    assert.equal(homepage.status, 200);
    assert.equal((await fetch(websiteBase + '/api/v1/worship')).status, 404, 'Website does not host the app API');
    assert.equal((await fetch('http://127.0.0.1:' + port + '/about/church')).status, 404, 'Admin does not host website pages');
    const legacyAdmin = await fetch(websiteBase + '/admin/worship', { redirect: 'manual' });
    assert.equal(legacyAdmin.status, 307);
    assert.ok(legacyAdmin.headers.get('location')?.endsWith('/admin/worship'));
    const login = await fetch('http://127.0.0.1:' + port + '/admin/login');
    assert.equal(login.status, 200);
    assert.match(await login.text(), /관리자 로그인/);
    const protectedRoute = await fetch('http://127.0.0.1:' + port + '/admin/dashboard', { redirect: 'manual' });
    assert.ok([303,307].includes(protectedRoute.status));
    assert.ok(protectedRoute.headers.get('location')?.includes('/admin/login'));
    const publicRow = await client.query(`SELECT id, slug FROM worship_contents WHERE status = 'PUBLISHED' AND "deletedAt" IS NULL AND ("publishedAt" IS NULL OR "publishedAt" <= NOW()) LIMIT 1`);
    assert.ok(publicRow.rows[0]);
    const item = publicRow.rows[0];
    const url = websiteBase + '/worship/videos/' + item.slug;
    assert.equal((await fetch(url)).status, 200);
    await client.query('UPDATE worship_contents SET title = $1 WHERE id = $2', ['분리 배포 갱신 검증', item.id]);
    assert.match(await (await fetch(url)).text(), /분리 배포 갱신 검증/, 'Website sees database changes without admin cache invalidation');
    console.log('Website/admin separation passed: route isolation, legacy redirect, protected CMS, public content refresh.');
    console.log("Production HTTP smoke passed: list/detail, pagination, hidden content 404, validation 422, POST 405, no-store.");
  } finally {
    await client.end();
    website.kill();
    if (website.exitCode === null) await once(website, 'exit');
    server.kill();
    if (server.exitCode === null) await once(server, "exit");
  }
}
