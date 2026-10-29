import {z} from 'zod';
import {siteSettingSchema} from './features/settings/schema';
export const siteSettingFields=['siteName','description','canonicalUrl','address','addressDetail','phone','email','mapLatitude','mapLongitude','youtubeUrl','transitInfo','parkingInfo','privacyOfficer','privacyContact','offeringBank','offeringNumber','offeringHolder','offeringNote'] as const;
export const siteSettingsPage=z.object({expectedUpdatedAt:z.iso.datetime().nullable(),values:z.record(z.enum(siteSettingFields),z.string())});
export const siteSettingsCommand=z.object({expectedUpdatedAt:z.iso.datetime().nullable(),values:siteSettingSchema,confirmed:z.literal(true)}).strict();
export type SiteSettingsPage=z.infer<typeof siteSettingsPage>;
