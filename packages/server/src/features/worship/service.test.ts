import assert from "node:assert/strict";
import test from "node:test";
import type { Prisma, PrismaClient } from "@daegwang/database/generated/client";
import { createWorshipService } from "@daegwang/server/features/worship/service-core";
import { worshipFormDataToInput } from "@daegwang/contracts/features/worship/schema";

const date = new Date("2026-10-02T00:00:00Z");
const actor = { adminId: "admin-1" };
const input = {
  type: "FIRST_HOUR", title: " 오늘의 묵상 ", contentDate: "2026-10-02",
  youtubeUrl: "https://youtu.be/dQw4w9WgXcQ", preacher: "", sermonTitle: "",
  scripture: "요한복음 1:1", description: "", summary: "", status: "PUBLISHED", isPinned: false,
};

function fixture(options: { inactive?: boolean; missing?: boolean; failAudit?: boolean; failPublication?: boolean } = {}) {
  let saved: Record<string, unknown> = { id: "content-1", title: "기존 제목", status: "DRAFT", publishedAt: null };
  let logs: Record<string, unknown>[] = [];
  let publication: Record<string, unknown> | null = null;
  let revisions: Record<string, unknown>[] = [];
  const database = {
    async $transaction(run: (tx: Prisma.TransactionClient) => Promise<unknown>) {
      let pending = { ...saved };
      const pendingLogs = [...logs];
      let pendingPublication = publication;
      const pendingRevisions = [...revisions];
      const tx = {
        $queryRaw: async () => [],
        worshipRevision: {
          findFirst: async () => pendingRevisions.at(-1) ?? null,
          create: async ({ data }: { data: Record<string, unknown> }) => { const row = { id: `r${pendingRevisions.length + 1}`, ...data }; pendingRevisions.push(row); return row; },
        },
        worshipPublication: {
          upsert: async ({ create }: { create: Record<string, unknown> }) => { if (options.failPublication) throw new Error('PUBLICATION_FAILED'); pendingPublication = create; return create; },
          deleteMany: async () => { pendingPublication = null; return { count: 1 }; },
        },
        adminProfile: { findUnique: async () => ({ id: actor.adminId, isActive: !options.inactive }) },
        worshipContent: {
          findFirst: async () => options.missing ? null : pending,
          create: async ({ data }: { data: Record<string, unknown> }) => (pending = { id: "content-1", createdAt: date, updatedAt: date, ...data }),
          update: async ({ data }: { data: Record<string, unknown> }) => (pending = { ...pending, createdAt: date, updatedAt: date, ...data }),
        },
        activityLog: { create: async ({ data }: { data: Record<string, unknown> }) => {
          if (options.failAudit) throw new Error("AUDIT_FAILED");
          pendingLogs.push(data);
          return data;
        } },
      };
      const result = await run(tx as unknown as Prisma.TransactionClient);
      saved = pending;
      logs = pendingLogs;
      publication = pendingPublication;
      revisions = pendingRevisions;
      return result;
    },
  } as unknown as Pick<PrismaClient, "$transaction">;
  return { service: createWorshipService(database, () => date), saved: () => saved, logs: () => logs, publication: () => publication, revisions: () => revisions };
}

test('one save publishes identical source fields and edits to both channels, hide/delete remove APP publication', async () => {
  const f = fixture();
  await f.service.create(actor, input);
  assert.equal(f.publication()?.worshipContentId, f.saved().id);
  assert.equal((f.revisions()[0].payload as { title: string }).title, f.saved().title);
  await f.service.update(actor, 'content-1', { ...input, title: '수정된 말씀' });
  assert.equal((f.revisions()[1].payload as { title: string }).title, f.saved().title);
  assert.equal(f.revisions()[1].revisionNo, 2);
  await f.service.update(actor, 'content-1', { ...input, status: 'PRIVATE' });
  assert.equal(f.publication(), null);
  await f.service.update(actor, 'content-1', input);
  assert.ok(f.publication());
  await f.service.delete(actor, 'content-1');
  assert.equal(f.publication(), null);
});
test('failed APP synchronization rolls back the website content and revision as well', async () => {
  const f = fixture({ failPublication: true });
  await assert.rejects(f.service.create(actor, input), /PUBLICATION_FAILED/);
  assert.equal(f.saved().title, '기존 제목');
  assert.equal(f.revisions().length, 0);
  assert.equal(f.publication(), null);
  assert.equal(f.logs().length, 0);
});

test("create normalizes YouTube metadata and stores publication plus audit", async () => {
  const f = fixture();
  await f.service.create(actor, input);
  assert.equal(f.saved().title, "오늘의 묵상");
  assert.equal(f.saved().youtubeUrl, "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  assert.equal(f.saved().slug, "first-hour-2026-10-02-dQw4w9WgXcQ");
  assert.deepEqual(f.saved().publishedAt, date);
  assert.equal(f.logs()[0].actorId, actor.adminId);
  assert.equal(f.logs()[0].action, "CREATE");
});

test("invalid content never writes", async () => {
  const f = fixture();
  await assert.rejects(f.service.create(actor, { ...input, title: "" }));
  await assert.rejects(f.service.create(actor, { ...input, youtubeUrl: "https://example.com/video" }));
  assert.equal(f.saved().title, "기존 제목");
  assert.equal(f.logs().length, 0);
});

test("inactive administrators cannot create, update or delete", async () => {
  const f = fixture({ inactive: true });
  await assert.rejects(f.service.create(actor, input), /FORBIDDEN/);
  await assert.rejects(f.service.update(actor, "content-1", input), /FORBIDDEN/);
  await assert.rejects(f.service.delete(actor, "content-1"), /FORBIDDEN/);
  assert.equal(f.logs().length, 0);
  assert.equal(f.saved().title, "기존 제목");
});

test("published edits retain initial publication date and log status transition", async () => {
  const f = fixture();
  const first = new Date("2026-09-01T00:00:00Z");
  f.saved().publishedAt = first;
  await f.service.update(actor, "content-1", input);
  assert.deepEqual(f.saved().publishedAt, first);
  assert.deepEqual(f.logs()[0].changes, { previousStatus: "DRAFT", nextStatus: "PUBLISHED" });
});

test("unpublishing clears publication timestamp", async () => {
  const f = fixture();
  await f.service.create(actor, input);
  await f.service.update(actor, "content-1", { ...input, status: "DRAFT" });
  assert.equal(f.saved().publishedAt, null);
});

test("missing or deleted content cannot be edited", async () => {
  const f = fixture({ missing: true });
  await assert.rejects(f.service.update(actor, "missing", input), /NOT_FOUND/);
  assert.equal(f.logs().length, 0);
});

test("audit failure aborts the same transaction as content creation", async () => {
  const f = fixture({ failAudit: true });
  await assert.rejects(f.service.create(actor, input), /AUDIT_FAILED/);
  assert.equal(f.saved().title, "기존 제목");
  assert.equal(f.logs().length, 0);
});

test("delete retains content and records soft deletion with audit", async () => {
  const f = fixture();
  await f.service.delete(actor, "content-1");
  assert.equal(f.saved().title, "기존 제목");
  assert.deepEqual(f.saved().deletedAt, date);
  assert.equal(f.logs()[0].action, "DELETE");
});

test("CMS form adapter handles absent optional values and checkbox", async () => {
  const form = new FormData();
  for (const [key, value] of Object.entries(input)) {
    if (value !== "" && key !== "isPinned") form.set(key, String(value));
  }
  form.set("isPinned", "on");
  const f = fixture();
  await f.service.create(actor, worshipFormDataToInput(form));
  assert.equal(f.saved().isPinned, true);
  assert.equal(f.saved().preacher, null);
});
