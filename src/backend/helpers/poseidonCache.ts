import type { PlayerMeta } from "@/stores/player/slices/source";
import { getProviderApiUrls } from "@/utils/proxyUrls";

const invalidatedKeys = new Set<string>();

function cacheKey(meta: PlayerMeta): string {
  return [
    "vaplayer",
    meta.tmdbId,
    meta.type === "show" ? "tv" : "movie",
    meta.season?.number ?? "",
    meta.episode?.number ?? "",
  ].join(":");
}

/**
 * Remove a failed cached Poseidon link. The next normal scrape then fetches
 * and stores a fresh link in the shared VPS cache.
 */
export async function invalidatePoseidonCache(meta: PlayerMeta): Promise<boolean> {
  if (!meta.tmdbId) return false;

  const key = cacheKey(meta);
  if (invalidatedKeys.has(key)) return false;

  const apiBase = getProviderApiUrls()[0];
  if (!apiBase) return false;

  invalidatedKeys.add(key);
  try {
    const response = await fetch(`${apiBase}/api/scrape/cache/invalidate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: "vaplayer",
        tmdbId: meta.tmdbId,
        mediaType: meta.type === "show" ? "tv" : "movie",
        season: meta.season?.number,
        episode: meta.episode?.number,
      }),
      keepalive: true,
    });
    if (!response.ok) throw new Error(`cache invalidation failed: ${response.status}`);
    return true;
  } catch (error) {
    invalidatedKeys.delete(key);
    console.warn("[poseidon-cache] failed to invalidate cached link", error);
    return false;
  }
}
