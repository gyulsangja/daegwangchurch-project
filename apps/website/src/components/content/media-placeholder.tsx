import { ImageIcon, Play } from "lucide-react";

export function MediaPlaceholder({
  type = "image",
  label = "이미지 준비 중",
  className = "",
}: {
  type?: "image" | "video";
  label?: string;
  className?: string;
}) {
  const Icon = type === "video" ? Play : ImageIcon;

  return (
    <div
      className={`flex aspect-video items-center justify-center bg-background-muted text-center text-text-secondary ${className}`}
    >
      <div>
        <Icon aria-hidden="true" className="mx-auto size-10 text-primary-600" />
        <p className="mt-3 text-sm font-semibold">{label}</p>
      </div>
    </div>
  );
}
