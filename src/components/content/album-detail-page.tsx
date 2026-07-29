import Chip from "@mui/material/Chip";
import { ArrowLeft, CalendarDays, Images } from "lucide-react";
import Link from "next/link";

import { AlbumGallery } from "@/components/content/album-gallery";
import { ContentShell } from "@/components/site/content-shell";

type AlbumDetail = {
  title: string;
  category: string;
  date: string;
  description: string;
  images: Array<{ id: string; url: string; alt: string; caption: string }>;
};

export function AlbumDetailPage({ album }: { album: AlbumDetail }) {
  return (
    <ContentShell>
      <Link href="/news/albums" className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-full font-bold text-text-secondary hover:text-primary-700"><ArrowLeft aria-hidden="true" className="size-4" /> 목록으로</Link>
      <article className="mt-8">
        <header className="border-b border-border pb-8">
          <Chip label={album.category} color="primary" variant="outlined" />
          <h1 className="text-balance mt-5 text-4xl font-extrabold tracking-[-0.05em] md:text-5xl">{album.title}</h1>
          <div className="mt-5 flex flex-wrap gap-5 text-sm text-text-secondary"><span className="flex items-center gap-2"><CalendarDays aria-hidden="true" className="size-4" />{album.date}</span><span className="flex items-center gap-2"><Images aria-hidden="true" className="size-4" />사진 {album.images.length}장</span></div>
          {album.description ? <p className="mt-6 max-w-3xl whitespace-pre-wrap text-lg leading-8 text-text-secondary">{album.description}</p> : null}
        </header>
        <div className="py-10"><AlbumGallery images={album.images} /></div>
      </article>
    </ContentShell>
  );
}

