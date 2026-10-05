import type { PrismaClient } from '@daegwang/database/generated/client';
import { pageKeys } from '@daegwang/contracts/features/pages/content';
import { churchAboutSchema, churchSchedulesSchema, churchPastorSchema, churchNewcomerSchema, churchContactSchema, publicHttpUrlSchema } from '@daegwang/contracts/features/church/app-contract';
import { publicAttachmentUrl } from '../notices/app-query-core';
export function createAppChurchQueries(database: Pick<PrismaClient, 'page' | 'worshipSchedule' | 'person' | 'siteSetting'>, now = () => new Date(), storageUrl?: string) {
  return {
    async pastor() {
      const row = await database.person.findFirst({ where: { isVisible: true, isSeniorPastor: true, deletedAt: null }, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }], select: { name: true, position: true, introduction: true, quote: true, career: true, profileImage: { select: { visibility: true, deletedAt: true, mimeType: true, bucket: true, objectPath: true } } } });
      if (!row) return null;
      const image = row.profileImage;
      const imageUrl = image && image.visibility === 'PUBLIC' && !image.deletedAt && ['image/jpeg', 'image/png', 'image/webp'].includes(image.mimeType) ? publicAttachmentUrl(storageUrl, image.bucket, image.objectPath) : null;
      return churchPastorSchema.parse({ ...row, imageUrl, career: Array.isArray(row.career) ? row.career.filter(item => typeof item === 'string') : [] });
    },
    async newcomer() {
      const row = await database.page.findFirst({ where: { key: pageKeys.newcomerEducation, status: 'PUBLISHED', deletedAt: null, OR: [{ publishedAt: null }, { publishedAt: { lte: now() } }] }, select: { title: true, content: true } });
      return row ? churchNewcomerSchema.parse(row) : null;
    },
    async contact() {
      const row = await database.siteSetting.findUnique({ where: { singletonKey: 'SITE' }, select: { siteName: true, address: true, addressDetail: true, phone: true, email: true, canonicalUrl: true, mapLatitude: true, mapLongitude: true, contactOptions: true } });
      if (!row) return null;
      const options = row.contactOptions;
      const text = (key: string) => options && typeof options === 'object' && !Array.isArray(options) && typeof options[key] === 'string' ? options[key] : '';
      const website = publicHttpUrlSchema.safeParse(row.canonicalUrl);
      return churchContactSchema.parse({ siteName: row.siteName, address: row.address ?? '', addressDetail: row.addressDetail ?? '', phone: row.phone ?? '', email: row.email ?? '', websiteUrl: website.success ? website.data : null,
        latitude: row.mapLatitude === null ? null : Number(row.mapLatitude), longitude: row.mapLongitude === null ? null : Number(row.mapLongitude), transitInfo: text('transitInfo'), parkingInfo: text('parkingInfo') });
    },
    async about() {
      const row = await database.page.findFirst({ where: { key: pageKeys.church, status: 'PUBLISHED', deletedAt: null, OR: [{ publishedAt: null }, { publishedAt: { lte: now() } }] }, select: { title: true, content: true } });
      return row ? churchAboutSchema.parse(row) : null;
    },
    async schedules() {
      const rows = await database.worshipSchedule.findMany({ where: { deletedAt: null, isVisible: true },
        select: { id: true, name: true, dayLabel: true, timeLabel: true, location: true, note: true }, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }] });
      return churchSchedulesSchema.parse(rows);
    },
  };
}
