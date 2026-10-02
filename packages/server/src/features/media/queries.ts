import "server-only";

import type { Prisma } from "@daegwang/database/generated/client";
import { getPrisma } from "@daegwang/database/prisma";
import { hasDatabaseConfig } from "@daegwang/config/env";

export const MEDIA_CLEANUP_GRACE_HOURS = 24;

export function getUnreferencedMediaWhere(
  cutoff = new Date(Date.now() - MEDIA_CLEANUP_GRACE_HOURS * 60 * 60 * 1000),
): Prisma.MediaWhereInput {
  return {
    createdAt: { lte: cutoff },
    people: { none: {} },
    ministries: { none: {} },
    worshipContents: { none: {} },
    bulletinsAsPdf: { none: {} },
    bulletinsAsCover: { none: {} },
    events: { none: {} },
    albums: { none: {} },
    albumImages: { none: {} },
    noticeAttachments: { none: {} },
    inquiryAttachments: { none: {} },
  };
}

export async function getMediaManagementData() {
  const empty = {
    totalCount: 0,
    totalBytes: 0,
    candidateCount: 0,
    candidateBytes: 0,
    candidates: [] as Array<{
      id: string;
      bucket: string;
      objectPath: string;
      originalName: string;
      mimeType: string;
      sizeBytes: number;
      createdAt: Date;
      deletedAt: Date | null;
    }>,
  };
  if (!hasDatabaseConfig()) return empty;

  const prisma = getPrisma();
  const where = getUnreferencedMediaWhere();
  const [totals, candidateTotals, candidates] = await Promise.all([
    prisma.media.aggregate({
      where: { deletedAt: null },
      _count: { _all: true },
      _sum: { sizeBytes: true },
    }),
    prisma.media.aggregate({
      where,
      _count: { _all: true },
      _sum: { sizeBytes: true },
    }),
    prisma.media.findMany({
      where,
      orderBy: { createdAt: "asc" },
      take: 200,
      select: {
        id: true,
        bucket: true,
        objectPath: true,
        originalName: true,
        mimeType: true,
        sizeBytes: true,
        createdAt: true,
        deletedAt: true,
      },
    }),
  ]);

  return {
    totalCount: totals._count._all,
    totalBytes: totals._sum.sizeBytes ?? 0,
    candidateCount: candidateTotals._count._all,
    candidateBytes: candidateTotals._sum.sizeBytes ?? 0,
    candidates,
  };
}
