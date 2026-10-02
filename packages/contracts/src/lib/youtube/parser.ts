const VIDEO_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

export type ParsedYouTubeUrl = {
  videoId: string;
  canonicalUrl: string;
  thumbnailUrl: string;
};

export function parseYouTubeUrl(input: string): ParsedYouTubeUrl | null {
  const value = input.trim();
  if (!value) return null;

  let url: URL;
  try {
    url = new URL(value.match(/^https?:\/\//i) ? value : `https://${value}`);
  } catch {
    return null;
  }

  const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
  let videoId: string | null = null;

  if (hostname === "youtu.be") {
    videoId = url.pathname.split("/").filter(Boolean)[0] ?? null;
  } else if (
    hostname === "youtube.com" ||
    hostname.endsWith(".youtube.com") ||
    hostname === "youtube-nocookie.com" ||
    hostname.endsWith(".youtube-nocookie.com")
  ) {
    if (url.pathname === "/watch") {
      videoId = url.searchParams.get("v");
    } else {
      const [prefix, id] = url.pathname.split("/").filter(Boolean);
      if (["embed", "shorts", "live"].includes(prefix ?? "")) videoId = id ?? null;
    }
  }

  if (!videoId || !VIDEO_ID_PATTERN.test(videoId)) return null;

  return {
    videoId,
    canonicalUrl: `https://www.youtube.com/watch?v=${videoId}`,
    thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
  };
}
