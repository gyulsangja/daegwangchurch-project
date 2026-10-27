import {cache} from "react";
import { decodeContentSlug } from "@daegwang/contracts/content-slug";
import "server-only";

import { bulletinVisibility } from './app-query-core';
import { getPrisma } from "@daegwang/database/prisma";
import { hasDatabaseConfig } from "@daegwang/config/env";

export async function getAdminBulletins(query = "") {
  if (!hasDatabaseConfig()) return [];
  const keyword = query.trim();
  return getPrisma().bulletin.findMany({
    where: {
      deletedAt: null,
      ...(keyword ? { title: { contains: keyword, mode: "insensitive" as const } } : {}),
    },
    include: { pdfMedia: true },
    orderBy: [{ worshipDate: "desc" }, { createdAt: "desc" }],
    take: 100,
  });
}

export async function getAdminBulletin(id: string) {
  if (!hasDatabaseConfig()) return null;
  return getPrisma().bulletin.findFirst({
    where: { id, deletedAt: null },
    include: { pdfMedia: true },
  });
}

const publishedWhere = () => bulletinVisibility(new Date());

export async function getPublishedBulletins(query = "", take = 30) {
  if (!hasDatabaseConfig()) return [];
  const keyword = query.trim();
  try {
    return await getPrisma().bulletin.findMany({
      where: {
        ...publishedWhere(),
        ...(keyword ? { title: { contains: keyword, mode: "insensitive" as const } } : {}),
      },
      include: { pdfMedia: true },
      orderBy: [{ worshipDate: "desc" }, { id: "desc" }],
      take,
    });
  } catch (error) {
    console.error("Failed to load published bulletins", error);
    return [];
  }
}

async function readgetPublishedBulletinBySlug(slug: string) {
  if (!hasDatabaseConfig()) return null;
  try {
    return await getPrisma().bulletin.findFirst({
      where: { slug: decodeContentSlug(slug), ...publishedWhere() },
      include: { pdfMedia: true },
    });
  } catch (error) {
    console.error("Failed to load published bulletin", error);
    return null;
  }
}


// Metadata and page render share only this request; publication changes stay fresh.
export const getPublishedBulletinBySlug=cache(readgetPublishedBulletinBySlug);
