import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { NoticeDetailPage } from "../../../../../components/content/notice-detail-page";
import { getNoticeBody, getPublishedNoticeBySlug } from "@daegwang/server/features/notices/queries";
import { getPublicStorageUrl } from "@daegwang/web-ui/lib/storage/public-url";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const notice = await getPublishedNoticeBySlug(slug);
  if (!notice) return { title: "공지사항" };
  return {
    title: notice.title,
    description: getNoticeBody(notice.content).replace(/\s+/g, " ").slice(0, 160),
    alternates: { canonical: `/news/notices/${notice.slug}` },
  };
}

export default async function NoticePage({ params }: Props) {
  const { slug } = await params;
  const notice = await getPublishedNoticeBySlug(slug);
  if (!notice) notFound();

  return <NoticeDetailPage notice={{
    title: notice.title,
    category: notice.category,
    body: getNoticeBody(notice.content),
    date: (notice.publishedAt ?? notice.createdAt).toLocaleDateString("ko-KR"),
    isImportant: notice.isImportant,
    isPinned: notice.isPinned,
    attachments: notice.attachments.map((attachment) => ({
      id: attachment.id,
      name: attachment.media.originalName,
      sizeBytes: attachment.media.sizeBytes,
      url: getPublicStorageUrl(attachment.media.bucket, attachment.media.objectPath),
    })),
  }} />;
}
