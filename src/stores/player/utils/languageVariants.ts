export interface LanguageVariant {
  language: string;
  label: string;
  id: string;
  type: "movie" | "show";
  season?: number;
  episode?: number;
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
        const res = await fetch(`${STREAMSCRAPER_HUB}/api/search?${params}`);
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
          id: `${provider}:${v.catalogId ?? v.id ?? ""}`,
          type: v.media_type === "tv" ? "show" : v.type ?? type,
          season: v.season,
          episode: v.episode,
        }));
      } catch {
        return [];
      }
    });

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
): Promise<string | null> {
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
    if (json?.proxyUrl) {
      return STREAMSCRAPER_HUB + json.proxyUrl;
    }
    return json?.url ?? null;
  } catch {
    return null;
  }
}
