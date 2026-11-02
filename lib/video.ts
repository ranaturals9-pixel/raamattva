import "server-only";
import crypto from "node:crypto";

/**
 * Bunny Stream embed URL. With token authentication switched on in Bunny,
 * links expire after a few hours, so a copied link stops working.
 */
export function videoEmbedUrl(videoId: string | null | undefined): string | null {
  const lib = process.env.BUNNY_STREAM_LIBRARY_ID;
  if (!videoId || !lib) return null;
  const base = `https://iframe.mediadelivery.net/embed/${lib}/${encodeURIComponent(videoId)}`;
  const key = process.env.BUNNY_STREAM_TOKEN_KEY;
  if (!key) return base;
  const expires = Math.floor(Date.now() / 1000) + 4 * 3600;
  const token = crypto.createHash("sha256").update(`${key}${videoId}${expires}`).digest("hex");
  return `${base}?token=${token}&expires=${expires}`;
}
