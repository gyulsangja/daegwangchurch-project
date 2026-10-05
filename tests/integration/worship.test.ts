import { createAppPublicationService } from "@daegwang/server/features/worship/app-publication-core";
import { createAppWorshipQueries } from "@daegwang/server/features/worship/app-query-core";
import { createAppWorshipHandlers } from "@daegwang/server/features/worship/app-api";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@daegwang/database/generated/client";
import { createWorshipService } from "@daegwang/server/features/worship/service-core";
import { createPublicWorshipQueries } from "@daegwang/server/features/worship/public-query-core";

const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString) throw new Error("Use npm run test:integration:worship (disposable DB required)");
const target = new URL(connectionString);
if (target.hostname !== "127.0.0.1" || target.pathname !== "/daegwang_worship_test") {
  throw new Error("Only the disposable local test database is allowed");
}
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
const clock = new Date("2026-10-02T01:00:00.000Z");
const service = createWorshipService(db, () => clock);
const published = createPublicWorshipQueries(db, () => clock);
let actor: { adminId: string };
const publisher = createAppPublicationService(db, () => clock);
const appQueries = createAppWorshipQueries(db, () => clock);
let serial = 0;
const input = (overrides: Record<string, unknown> = {}) => ({
  type: "FIRST_HOUR", title: "통합 검증 묵상", contentDate: "2026-10-02",
  youtubeUrl: `https://youtu.be/T${String(++serial).padStart(10, "0")}`,
  preacher: "테스트", sermonTitle: "설교 제목", scripture: "요한복음 1:1",
  description: "설명", summary: "요약", status: "DRAFT", isPinned: false, ...overrides,
});

before(async () => {
  const admin = await db.adminProfile.create({ data: {
    authUserId: randomUUID(), email: "test@example.invalid", displayName: "통합 테스트", role: "ADMIN",
  } });
  actor = { adminId: admin.id };
});
after(async () => { await db.$disconnect(); });

test("create -> re-query -> publish -> edit -> soft delete preserves DB and public behavior", async () => {
  const source = input();
  const created = await service.create(actor, source);
  assert.equal((await db.worshipContent.findUniqueOrThrow({ where: { id: created.id } })).title, source.title);
  assert.equal(await published.bySlug(created.slug), null);
  const live = await service.update(actor, created.id, { ...source, status: "PUBLISHED" });
  assert.equal((await published.bySlug(live.slug))?.id, created.id);
  assert.ok((await published.list("FIRST_HOUR")).some((row) => row.id === created.id));
  const changed = await service.update(actor, created.id, { ...source, status: "PUBLISHED", title: "수정된 묵상" });
  assert.equal((await published.bySlug(changed.slug))?.title, "수정된 묵상");
  assert.deepEqual(changed.publishedAt, live.publishedAt);
  await service.delete(actor, created.id);
  assert.equal(await published.bySlug(changed.slug), null);
  assert.ok(!(await published.list("FIRST_HOUR")).some((row) => row.id === created.id));
  assert.deepEqual((await db.worshipContent.findUniqueOrThrow({ where: { id: created.id } })).deletedAt, clock);
  const logs = await db.activityLog.findMany({ where: { entityId: created.id }, orderBy: { createdAt: "asc" } });
  assert.deepEqual(logs.map((log) => log.action), ["CREATE", "UPDATE", "UPDATE", "DELETE"]);
});

test("clearing optional form fields removes previous values in PostgreSQL", async () => {
  const source = input();
  const content = await service.create(actor, source);
  await service.update(actor, content.id, {
    ...source, preacher: "", sermonTitle: "", scripture: "", description: "", summary: "",
  });
  const saved = await db.worshipContent.findUniqueOrThrow({ where: { id: content.id } });
  for (const field of ["preacher", "sermonTitle", "scripture", "description", "summary"] as const) {
    assert.equal(saved[field], null, `${field} must be cleared`);
  }
});

test("draft, private, future and deleted content are hidden; legacy null publication is visible", async () => {
  for (const kind of ["DRAFT", "PRIVATE", "FUTURE", "DELETED", "LEGACY"] as const) {
    const content = await service.create(actor, input({ status: kind === "DRAFT" || kind === "PRIVATE" ? kind : "PUBLISHED" }));
    if (kind === "FUTURE") await db.worshipContent.update({ where: { id: content.id }, data: { publishedAt: new Date("2099-01-01") } });
    if (kind === "DELETED") await service.delete(actor, content.id);
    if (kind === "LEGACY") await db.worshipContent.update({ where: { id: content.id }, data: { publishedAt: null } });
    assert.equal(Boolean(await published.bySlug(content.slug)), kind === "LEGACY");
    assert.equal((await published.list("FIRST_HOUR", 100)).some((row) => row.id === content.id), kind === "LEGACY");
  }
});

test("invalid, unknown and inactive actors cannot persist changes", async () => {
  const count = await db.worshipContent.count();
  await assert.rejects(service.create(actor, input({ youtubeUrl: "https://example.com" })));
  await assert.rejects(service.create({ adminId: "missing" }, input()), /FORBIDDEN/);
  const inactive = await db.adminProfile.create({ data: { authUserId: randomUUID(), email: "inactive@example.invalid", displayName: "비활성", isActive: false } });
  await assert.rejects(service.create({ adminId: inactive.id }, input()), /FORBIDDEN/);
  assert.equal(await db.worshipContent.count(), count);
});

test("audit insert failure rolls back content insert in real PostgreSQL", async () => {
  const count = await db.worshipContent.count();
  await db.$executeRawUnsafe(`CREATE FUNCTION reject_test_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'TEST_AUDIT_FAILURE'; END $$`);
  await db.$executeRawUnsafe(`CREATE TRIGGER reject_test_audit BEFORE INSERT ON activity_logs FOR EACH ROW EXECUTE FUNCTION reject_test_audit()`);
  try {
    await assert.rejects(service.create(actor, input()));
    assert.equal(await db.worshipContent.count(), count);
  } finally {
    await db.$executeRawUnsafe("DROP TRIGGER reject_test_audit ON activity_logs");
    await db.$executeRawUnsafe("DROP FUNCTION reject_test_audit()");
  }
});

test("duplicate slug fails without an extra content or audit row", async () => {
  const source = input();
  await service.create(actor, source);
  const contents = await db.worshipContent.count();
  const logs = await db.activityLog.count();
  await assert.rejects(service.create(actor, source));
  assert.equal(await db.worshipContent.count(), contents);
  assert.equal(await db.activityLog.count(), logs);
});

test("one content save keeps WEB and APP identical and private saves withdraw both", async () => {
  const source = input({ status: "PUBLISHED" });
  const content = await service.create(actor, source);
  assert.equal((await appQueries.detail(content.id))?.title, source.title);
  const edited = await service.update(actor, content.id, { ...source, title: "Updated shared title" });
  const dto = await appQueries.detail(content.id);
  assert.equal(dto?.title, (await published.bySlug(edited.slug))?.title);
  assert.equal(dto?.version, 2);
  await service.update(actor, content.id, { ...source, status: "PRIVATE" });
  assert.equal(await appQueries.detail(content.id), null);
  assert.equal(await published.bySlug(edited.slug), null);
});

test("APP start/end windows, channel and parent deletion apply to list and detail", async () => {
  for (const kind of ["FUTURE", "ENDED", "WEB", "DELETED"] as const) {
    const content = await service.create(actor, input({ status: "PUBLISHED" }));
    const pub = await publisher.publish(actor, content.id, content.updatedAt.toISOString());
    if (kind === "FUTURE") await db.worshipPublication.update({ where: { id: pub.id }, data: { startsAt: new Date("2099-01-01") } });
    if (kind === "ENDED") await db.worshipPublication.update({ where: { id: pub.id }, data: { endsAt: clock } });
    if (kind === "WEB") await db.worshipPublication.update({ where: { id: pub.id }, data: { channel: "WEB" } });
    if (kind === "DELETED") await service.delete(actor, content.id);
    assert.equal(await appQueries.detail(content.id), null);
    assert.equal((await appQueries.list({})).data.some((row) => row.id === content.id), false);
  }
});

test("APP list pagination and type filter use published snapshots", async () => {
  const ids: string[] = [];
  for (let index = 0; index < 3; index++) {
    const source = input({ type: "PRAISE", status: "PUBLISHED" });
    const content = await service.create(actor, source);
    await publisher.publish(actor, content.id, content.updatedAt.toISOString());
    ids.push(content.id);
  }
  const first = await appQueries.list({ type: "PRAISE", limit: 2 });
  assert.equal(first.data.length, 2);
  assert.ok(first.nextCursor);
  const last = await appQueries.list({ type: "PRAISE", limit: 2, cursor: first.nextCursor });
  assert.equal(last.data.length, 1);
  assert.equal(last.nextCursor, null);
  assert.deepEqual([...first.data, ...last.data].map((row) => row.id).sort(), ids.sort());
});

test("APP denies inactive actors and rolls publication back when audit fails", async () => {
  const content = await service.create(actor, input());
  const stamp = content.updatedAt.toISOString();
  await assert.rejects(publisher.publish({ adminId: "missing" }, content.id, stamp), /FORBIDDEN/);
  await assert.rejects(publisher.unpublish({ adminId: "missing" }, content.id, stamp), /FORBIDDEN/);
  const inactive = await db.adminProfile.findUniqueOrThrow({ where: { email: "inactive@example.invalid" } });
  await assert.rejects(publisher.publish({ adminId: inactive.id }, content.id, stamp), /FORBIDDEN/);
  await db.$executeRawUnsafe(`CREATE FUNCTION reject_publish_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'TEST_AUDIT_FAILURE'; END $$`);
  await db.$executeRawUnsafe(`CREATE TRIGGER reject_publish_audit BEFORE INSERT ON activity_logs FOR EACH ROW EXECUTE FUNCTION reject_publish_audit()`);
  try {
    await assert.rejects(publisher.publish(actor, content.id, stamp));
    assert.equal(await db.worshipRevision.count({ where: { worshipContentId: content.id } }), 0);
    assert.equal(await appQueries.detail(content.id), null);
  } finally {
    await db.$executeRawUnsafe("DROP TRIGGER reject_publish_audit ON activity_logs");
    await db.$executeRawUnsafe("DROP FUNCTION reject_publish_audit()");
  }
});

test("HTTP handlers return bounded DTOs, 404/422/503 and no-store", async () => {
  const handlers = createAppWorshipHandlers(() => appQueries, () => true);
  const content = await service.create(actor, input());
  assert.equal((await handlers.detail(content.id)).status, 404);
  const saved = await db.worshipContent.findUniqueOrThrow({ where: { id: content.id } });
  await service.update(actor, content.id, { ...input(), youtubeUrl: saved.youtubeUrl, status: "PUBLISHED" });
  const response = await handlers.detail(content.id);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.equal((await response.json()).data.id, content.id);
  for (const query of ["limit=0", "limit=51", "type=INVALID", "cursor=bad", "unexpected=true", "limit=1&limit=2"]) {
    assert.equal((await handlers.list(new Request(`http://localhost/api/v1/worship?${query}`))).status, 422);
  }
  const off = createAppWorshipHandlers(() => { throw new Error("Must not access DB"); }, () => false);
  assert.equal((await off.detail(content.id)).status, 503);
});

test("concurrent same-source publishes produce one revision and one audit", async () => {
  const content = await service.create(actor, input());
  const results = await Promise.all([1, 2, 3].map(() => publisher.publish(actor, content.id, content.updatedAt.toISOString())));
  assert.equal(new Set(results.map((row) => row.publishedRevisionId)).size, 1);
  assert.equal(await db.worshipRevision.count({ where: { worshipContentId: content.id } }), 1);
  assert.equal(await db.activityLog.count({ where: { entityId: content.id, action: "PUBLISH" } }), 1);
});

test("database foreign keys reject a revision belonging to another content", async () => {
  const first = await service.create(actor, input());
  const second = await service.create(actor, input());
  const publication = await publisher.publish(actor, first.id, first.updatedAt.toISOString());
  await assert.rejects(db.worshipPublication.create({ data: {
    worshipContentId: second.id, channel: "APP", publishedRevisionId: publication.publishedRevisionId,
    sourceUpdatedAt: second.updatedAt, startsAt: clock,
  } }));
});

test("RLS denies direct reading of publication and historical revision tables", async () => {
  await db.$executeRawUnsafe("CREATE ROLE worship_test_reader NOLOGIN");
  await db.$executeRawUnsafe("GRANT USAGE ON SCHEMA public TO worship_test_reader");
  await db.$executeRawUnsafe("GRANT SELECT ON worship_revisions, worship_publications TO worship_test_reader");
  await db.$transaction(async (tx) => {
    await tx.$executeRawUnsafe("SET LOCAL ROLE worship_test_reader");
    assert.equal(await tx.worshipRevision.count(), 0);
    assert.equal(await tx.worshipPublication.count(), 0);
  });
});

test("mobile client consumes real published DTOs and month filtering uses the published date", async () => {
  const { createWorshipClient } = await import('@daegwang/api-client/worship');
  const handlers = createAppWorshipHandlers(() => appQueries, () => true);
  const mobile = createWorshipClient("http://local", async (request) => {
    const url = new URL(String(request));
    return url.pathname === "/api/v1/worship" ? handlers.list(new Request(url)) : handlers.detail(url.pathname.split("/").at(-1)!);
  });
  const source = input({ contentDate: "2025-04-02", status: "PUBLISHED" });
  const content = await service.create(actor, source);
  await publisher.publish(actor, content.id, content.updatedAt.toISOString());
  await service.update(actor, content.id, { ...source, contentDate: "2025-05-02" });
  assert.ok(!(await mobile.list({ month: "2025-04" })).data.some((item) => item.id === content.id));
  assert.equal((await mobile.detail(content.id)).contentDate, "2025-05-02");
  assert.ok((await mobile.list({ month: "2025-05" })).data.some((item) => item.id === content.id));
  assert.equal((await handlers.list(new Request("http://local/api/v1/worship?month=2025-13"))).status, 422);
});
