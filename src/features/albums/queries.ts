import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/db/prisma";
import { hasDatabaseConfig } from "@/lib/env";

const albumMediaInclude = {
  coverImage: true,
  images: { include: { media: true }, orderBy: { sortOrder: "asc" as const } },
};

export async function getAdminAlbums(query = "") {
  if (!hasDatabaseConfig()) return [];
  const keyword = query.trim();
  return getPrisma().album.findMany({
    where: {
      deletedAt: null,
      ...(keyword ? { OR: [
        { title: { contains: keyword, mode: "insensitive" as const } },
        { category: { contains: keyword, mode: "insensitive" as const } },
      ] } : {}),
    },
    include: albumMediaInclude,
    orderBy: [{ eventDate: "desc" }, { createdAt: "desc" }],
    take: 100,
  });
}

export async function getAdminAlbum(id: string) {
  if (!hasDatabaseConfig()) return null;
  return getPrisma().album.findFirst({ where: { id, deletedAt: null }, include: albumMediaInclude });
}

function publishedWhere(): Prisma.AlbumWhereInput {
  return { status: "PUBLISHED", deletedAt: null, OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }] };
}

export async function getPublishedAlbums(query = "", take = 30) {
  if (!hasDatabaseConfig()) return [];
  const keyword = query.trim();
  try {
    return await getPrisma().album.findMany({
      where: {
        ...publishedWhere(),
        ...(keyword ? { OR: [
          { title: { contains: keyword, mode: "insensitive" as const } },
          { category: { contains: keyword, mode: "insensitive" as const } },
        ] } : {}),
      },
      include: albumMediaInclude,
      orderBy: [{ showOnMain: "desc" }, { eventDate: "desc" }, { publishedAt: "desc" }],
      take,
    });
  } catch (error) {
    console.error("Failed to load published albums", error);
    return [];
  }
}

export async function getPublishedAlbumBySlug(slug: string) {
  if (!hasDatabaseConfig()) return null;
  try {
    return await getPrisma().album.findFirst({ where: { slug, ...publishedWhere() }, include: albumMediaInclude });
  } catch (error) {
    console.error("Failed to load published album", error);
    return null;
  }
}

