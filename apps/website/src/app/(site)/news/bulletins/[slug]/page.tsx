import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BulletinDetailPage } from "../../../../../components/content/bulletin-detail-page";
import { getPublishedBulletinBySlug } from "@daegwang/server/features/bulletins/queries";
import { getPublicStorageUrl } from "@daegwang/web-ui/lib/storage/public-url";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const bulletin = await getPublishedBulletinBySlug(slug);
  if (!bulletin) return { title: "주보" };
  return {
    title: bulletin.title,
    description: bulletin.summary ?? `${bulletin.worshipDate.toLocaleDateString("ko-KR")} 독산대광교회 주보`,
    alternates: { canonical: `/news/bulletins/${bulletin.slug}` },
  };
}

export default async function BulletinPage({ params }: Props) {
  const { slug } = await params;
  const bulletin = await getPublishedBulletinBySlug(slug);
  if (!bulletin) notFound();
  return <BulletinDetailPage bulletin={{
    title: bulletin.title,
    date: bulletin.worshipDate.toLocaleDateString("ko-KR"),
    summary: bulletin.summary ?? "",
    pdfName: bulletin.pdfMedia.originalName,
    pdfUrl: getPublicStorageUrl(bulletin.pdfMedia.bucket, bulletin.pdfMedia.objectPath),
  }} />;
}

