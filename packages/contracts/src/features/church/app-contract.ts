import { z } from 'zod';
export const churchContentSchema = z.object({
  heroTitle: z.string().default(''), heroDescription: z.string().default(''), sinceLabel: z.string().default(''), motto: z.string().default(''),
  sectionTitle: z.string().default(''), body: z.string().default(''), values: z.array(z.object({ title: z.string(), description: z.string() })).default([]),
});
export const churchAboutSchema = z.object({ title: z.string(), content: churchContentSchema });
export const churchSchedulesSchema = z.array(z.object({ id: z.string(), name: z.string(), dayLabel: z.string(), timeLabel: z.string(), location: z.string().nullable(), note: z.string().nullable() }));
export const publicHttpUrlSchema = z.url().refine(value => { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password; });
export const churchPastorSchema = z.object({ name: z.string(), position: z.string(), introduction: z.string().nullable(), quote: z.string().nullable(), career: z.array(z.string()), imageUrl: publicHttpUrlSchema.nullable() });
export const churchNewcomerSchema = z.object({ title: z.string(), content: z.object({ heroTitle: z.string().default(''), heroDescription: z.string().default(''), processTitle: z.string().default(''), duration: z.string().default(''), location: z.string().default(''), leader: z.string().default(''), applicationInfo: z.string().default(''), steps: z.array(z.object({ title: z.string(), description: z.string() })).default([]) }) });
export const churchContactSchema = z.object({ siteName: z.string(), address: z.string(), addressDetail: z.string(), phone: z.string(), email: z.string(), websiteUrl: publicHttpUrlSchema.nullable(), latitude: z.number().min(-90).max(90).nullable(), longitude: z.number().min(-180).max(180).nullable(), transitInfo: z.string(), parkingInfo: z.string() });
