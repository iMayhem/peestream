export interface LanguageVariant {
  language: string;
  label: string;
  provider: string;
  id: string;
  type: "movie" | "show";
  season?: number;
  episode?: number;
}

export interface ResolvedLanguageVariant {
  url: string;
  type: "hls" | "file";
}

const STREAMSCRAPER_HUB = "https://providers.peestream.in";

export async function fetchLanguageVariants(
  title: string,
  year: number,
  type: "movie" | "show",
  tmdbId?: string,
  season?: number,
  episode?: number,
): Promise<LanguageVariant[]> {
  try {
    const providers = ["moovie-catalog", "homecine", "zetflix"];
    const promises = providers.map(async (provider) => {
      try {
        const params = new URLSearchParams({
          q: title,
          type,
          provider,
        });
        if (tmdbId) params.set("tmdbId", tmdbId);
        if (season != null) params.set("season", String(season));
        if (episode != null) params.set("episode", String(episode));
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15_000);
        try {
          const res = await fetch(`${STREAMSCRAPER_HUB}/api/search?${params}`, {
            signal: controller.signal,
          });
          if (!res.ok) return [];
          const text = await res.text();
          let json: any;
          try {
            json = JSON.parse(text);
          } catch {
            return [];
          }
          if (!json || typeof json !== "object") return [];
          const items = json.results?.reduce?.((acc: any[], r: any) => {
            const v = r.streams?.[0]?._languageVariants;
            if (v) acc.push(...v);
            return acc;
          }, []) ?? [];
          return items.map((v: any) => ({
            language: v.language ?? "unknown",
            label: v.language ?? "Unknown",
            provider,
            id: `${provider}:${v.catalogId ?? v.id ?? ""}`,
            type: v.media_type === "tv" ? "show" : v.type ?? type,
            season: v.season,
            episode: v.episode,
          }));
        } finally {
          clearTimeout(timeout);
        }
      } catch {
        return [];
      }
    });

    // Also fetch French variants from FrenchStream (fss)
    if (type === "movie" && tmdbId) {
      promises.push((async () => {
        try {
          const params = new URLSearchParams({ tmdbId, type, title });
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 30_000);
          try {
            const res = await fetch(`${STREAMSCRAPER_HUB}/api/variants/fss?${params}`, {
              signal: controller.signal,
            });
            if (!res.ok) return [];
            const json = await res.json();
            if (!json?.variants?.length) return [];
            return json.variants.map((v: any) => ({
              language: v.language || "french",
              label: v.label || "French",
              provider: "fss",
              id: v.id || `fss:${v.language || "french"}`,
              type: "movie",
            }));
          } finally {
            clearTimeout(timeout);
          }
        } catch {
          return [];
        }
      })());
    }

    // Also fetch German variants from StreamKiste (streamkiste.life)
    if (type === "movie" && tmdbId) {
      promises.push((async () => {
        try {
          const params = new URLSearchParams({ tmdbId, type, title });
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 30_000);
          try {
            const res = await fetch(`${STREAMSCRAPER_HUB}/api/variants/de?${params}`, {
              signal: controller.signal,
            });
            if (!res.ok) return [];
            const json = await res.json();
            if (!json?.variants?.length) return [];
            return json.variants.map((v: any) => ({
              language: v.language || "german",
              label: v.label || "German",
              provider: "streamkiste",
              id: v.id || `streamkiste:${tmdbId}`,
              type: "movie",
            }));
          } finally {
            clearTimeout(timeout);
          }
        } catch {
          return [];
        }
      })());
    }

    const results = await Promise.all(promises);
    return results.flat();
  } catch {
    return [];
  }
}

export async function resolveLanguageVariantUrl(
  id: string,
  type: "movie" | "show",
  season?: number,
  episode?: number,
): Promise<ResolvedLanguageVariant | null> {
  try {
    let provider = "moovie-catalog";
    let actualId = id;
    if (id.includes(":")) {
      const idx = id.indexOf(":");
      provider = id.substring(0, idx);
      actualId = id.substring(idx + 1);
    }

    const params = new URLSearchParams({
      provider,
      id: actualId,
      type,
    });
    if (season != null) params.set("season", String(season));
    if (episode != null) params.set("episode", String(episode));
    const res = await fetch(
      `${STREAMSCRAPER_HUB}/api/resolve-variant?${params}`,
    );
    if (!res.ok) return null;
    const text = await res.text();
    let json: any;
    try {
      json = JSON.parse(text);
    } catch {
      return null;
    }
    const url = json?.proxyUrl
      ? STREAMSCRAPER_HUB + json.proxyUrl
      : json?.url;
    if (!url) return null;

    // Proxy URLs do not retain the original file extension. Trust the server's
    // explicit type first so HLS variants are not loaded as MP4 files.
    const responseType = String(json?.type ?? "").toLowerCase();
    const isHls = responseType === "m3u8" || responseType === "hls" || url.includes(".m3u8");
    return { url, type: isHls ? "hls" : "file" };
  } catch {
    return null;
  }
}
