"use client";

import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

type GalleryImage = { id: string; url: string; alt: string; caption: string };

export function AlbumGallery({ images }: { images: GalleryImage[] }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const selected = selectedIndex === null ? null : images[selectedIndex];
  const move = (direction: number) => {
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex + direction + images.length) % images.length);
  };

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((image, index) => (
          <button key={image.id} type="button" onClick={() => setSelectedIndex(index)} className="focus-ring group overflow-hidden rounded-2xl border border-border bg-background-muted text-left">
            <Image src={image.url} alt={image.alt} width={900} height={675} className="aspect-[4/3] w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
            {image.caption ? <span className="block px-4 py-3 text-sm text-text-secondary">{image.caption}</span> : null}
          </button>
        ))}
      </div>
      <Dialog open={selected !== null} onClose={() => setSelectedIndex(null)} maxWidth="lg" fullWidth>
        {selected ? (
          <DialogContent className="relative bg-black p-2! sm:p-6!">
            <IconButton onClick={() => setSelectedIndex(null)} aria-label="닫기" className="absolute right-3 top-3 z-10 bg-black/60! text-white!"><X aria-hidden="true" /></IconButton>
            {images.length > 1 ? <IconButton onClick={() => move(-1)} aria-label="이전 사진" className="absolute left-3 top-1/2 z-10 -translate-y-1/2 bg-black/60! text-white!"><ChevronLeft aria-hidden="true" /></IconButton> : null}
            <Image src={selected.url} alt={selected.alt} width={1600} height={1200} className="max-h-[80vh] w-full object-contain" />
            {images.length > 1 ? <IconButton onClick={() => move(1)} aria-label="다음 사진" className="absolute right-3 top-1/2 z-10 -translate-y-1/2 bg-black/60! text-white!"><ChevronRight aria-hidden="true" /></IconButton> : null}
            {selected.caption ? <p className="px-4 pt-4 text-center text-sm text-white">{selected.caption}</p> : null}
          </DialogContent>
        ) : null}
      </Dialog>
    </>
  );
}

