import { publicEnv } from "@/lib/env";

export function getPublicStorageUrl(bucket: string, objectPath: string) {
  const baseUrl = publicEnv.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl) return "";
  const encodedPath = objectPath.split("/").map(encodeURIComponent).join("/");
  return `${baseUrl}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodedPath}`;
}

