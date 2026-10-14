import { z } from 'zod';
export const offeringAccountSchema = z.object({
  bank: z.string().default(''), number: z.string().default(''), holder: z.string().default(''), note: z.string().default(''),
});
export type OfferingAccount = z.infer<typeof offeringAccountSchema>;
export function hasOfferingAccount(account: OfferingAccount) { return Boolean(account.bank.trim() && account.number.trim() && account.holder.trim()); }
export function readOfferingAccount(value: unknown): OfferingAccount {
  const options = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const text = (key: string) => typeof options[key] === 'string' ? options[key] as string : '';
  return { bank: text('offeringBank'), number: text('offeringNumber'), holder: text('offeringHolder'), note: text('offeringNote') };
}
