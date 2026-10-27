import {cache} from "react";
import "server-only";

import type { WorshipContentType } from "@daegwang/database/generated/client";
import { createPublicWorshipQueries } from "@daegwang/server/features/worship/public-query-core";
import { getPrisma } from "@daegwang/database/prisma";
import { hasDatabaseConfig } from "@daegwang/config/env";
import { worshipTypeSchema } from '@daegwang/contracts/features/worship/app-contract';
import { worshipVisibility } from './public-query-core';

export type WorshipArchiveSearch = { q?: string; month?: string; page?: string; type?: string };
export async function getWorshipArchive(search: WorshipArchiveSearch = {}, publicType?: WorshipContentType) {
  const q = typeof search.q === 'string' ? search.q.trim().slice(0, 100) : '';
  const month = typeof search.month === 'string' && /^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(search.month) ? search.month : '';
  const parsedType = worshipTypeSchema.safeParse(search.type);
  const type = publicType ?? (parsedType.success ? parsedType.data : undefined);
  const rawPage = Number(search.page); const requestedPage = Number.isSafeInteger(rawPage) && rawPage > 0 ? Math.min(rawPage, 10000) : 1;
  const pageSize = publicType ? 12 : 30;
  const empty = { items: [], total: 0, page: 1, pageCount: 1, q, month, type };
  if (!hasDatabaseConfig()) return empty;
  const start = month ? new Date(`${month}-01T00:00:00Z`) : undefined;
  const end = start ? new Date(start) : undefined; if (end) end.setUTCMonth(end.getUTCMonth() + 1);
  const where = { ...(publicType ? worshipVisibility(new Date()) : { deletedAt: null }), ...(type ? { type } : {}), ...(start && end ? { contentDate: { gte: start, lt: end } } : {}), ...(q ? { AND: [{ OR: ['title', 'preacher', 'scripture', 'description'].map(field => ({ [field]: { contains: q, mode: 'insensitive' as const } })) }] } : {}) };
  const total = await getPrisma().worshipContent.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / pageSize)); const page = Math.min(requestedPage, pageCount);
  const items = await getPrisma().worshipContent.findMany({ where, orderBy: [{ isPinned: 'desc' }, { contentDate: 'desc' }, { id: 'desc' }], take: pageSize, skip: (page - 1) * pageSize });
  return { items, total, page, pageCount, q, month, type };
}

export async function getAdminWorshipContents(query = '') {
  if (!hasDatabaseConfig()) return [];
  return getPrisma().worshipContent.findMany({
    where: { deletedAt: null, ...(query.trim() ? { OR: [
      { title: { contains: query.trim(), mode: 'insensitive' as const } },
      { preacher: { contains: query.trim(), mode: 'insensitive' as const } },
    ] } : {}) },
    orderBy: [{ isPinned: "desc" }, { contentDate: "desc" }, { createdAt: "desc" }],
    take: 100,
  });
}

export async function getAdminWorshipContent(id: string) {
  if (!hasDatabaseConfig()) return null;
  return getPrisma().worshipContent.findFirst({ where: { id, deletedAt: null } });
}

export async function getPublishedWorshipContents(type: WorshipContentType, take = 12) {
  if (!hasDatabaseConfig()) return [];
  try {
    return await createPublicWorshipQueries(getPrisma()).list(type, take);
  } catch (error) {
    console.error("Failed to load published worship contents", error);
    return [];
  }
}

async function readgetPublishedWorshipContentBySlug(slug: string) {
  if (!hasDatabaseConfig()) return null;
  try {
    return await createPublicWorshipQueries(getPrisma()).bySlug(slug);
  } catch (error) {
    console.error("Failed to load worship content", error);
    return null;
  }
}

// Metadata and page render share only this request; publication changes stay fresh.
export const getPublishedWorshipContentBySlug=cache(readgetPublishedWorshipContentBySlug);
