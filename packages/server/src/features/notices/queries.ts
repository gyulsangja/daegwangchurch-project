import {cache} from "react";
import "server-only";

import type { Prisma } from "@daegwang/database/generated/client";
import { getPrisma } from "@daegwang/database/prisma";
import { hasDatabaseConfig } from "@daegwang/config/env";
import { publishedNoticeWhere } from './public-policy';
import { decodeNoticeSlug } from '@daegwang/contracts/features/notices/attachments';

type NoticeContent = { body?: unknown };

export function getNoticeBody(content: Prisma.JsonValue): string {
  if (typeof content === "string") return content;
  if (content && typeof content === "object" && !Array.isArray(content)) {
    const body = (content as NoticeContent).body;
    return typeof body === "string" ? body : "";
  }
  return "";
}

export async function getAdminNotices(query = "") {
  if (!hasDatabaseConfig()) return [];
  const keyword = query.trim();
  return getPrisma().notice.findMany({
    where: {
      deletedAt: null,
      ...(keyword
        ? {
            OR: [
              { title: { contains: keyword, mode: "insensitive" as const } },
              { category: { contains: keyword, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    orderBy: [{ isPinned: "desc" }, { isImportant: "desc" }, { createdAt: "desc" }],
    take: 100,
  });
}

export async function getAdminNotice(id: string) {
  if (!hasDatabaseConfig()) return null;
  return getPrisma().notice.findFirst({
    where: { id, deletedAt: null },
    include: { attachments: { include: { media: true }, orderBy: { sortOrder: "asc" } } },
  });
}

export async function getPublishedNotices(query = "", take = 30) {
  if (!hasDatabaseConfig()) return [];
  const now = new Date();
  const keyword = query.trim();
  try {
    return await getPrisma().notice.findMany({
      where: {
        ...publishedNoticeWhere(now),
        ...(keyword
          ? {
              OR: [
                { title: { contains: keyword, mode: "insensitive" as const } },
                { category: { contains: keyword, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
      orderBy: [{ isPinned: "desc" }, { isImportant: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
      take,
    });
  } catch (error) {
    console.error("Failed to load published notices", error);
    return [];
  }
}

async function readgetPublishedNoticeBySlug(slug: string) {
  if (!hasDatabaseConfig()) return null;
  try {
    return await getPrisma().notice.findFirst({
      where: { slug: decodeNoticeSlug(slug), ...publishedNoticeWhere(new Date()) },
      include: { attachments: { where: { media: { visibility: 'PUBLIC', deletedAt: null } }, include: { media: true }, orderBy: { sortOrder: "asc" } } },
    });
  } catch (error) {
    console.error("Failed to load published notice", error);
    return null;
  }
}


// Metadata and page render share only this request; publication changes stay fresh.
export const getPublishedNoticeBySlug=cache(readgetPublishedNoticeBySlug);
