import "server-only";

export function getInquiryRetentionDays() {
  const parsed = Number(process.env.INQUIRY_RETENTION_DAYS ?? "365");
  return Number.isInteger(parsed) && parsed >= 30 && parsed <= 3650 ? parsed : 365;
}
