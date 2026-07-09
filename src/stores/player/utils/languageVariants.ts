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
): Promise<LanguageVariant[]> {
  try {
    const params = new URLSearchParams({
      q: title,
      type,
      provider: "moovie-catalog",
    });
    if (tmdbId) params.set("tmdbId", tmdbId);
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
      id: v.catalogId ?? v.id ?? "",
      type: v.media_type === "tv" ? "show" : v.type ?? type,
      season: v.season,
      episode: v.episode,
    }));
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
    const params = new URLSearchParams({
      provider: "moovie-catalog",
      id,
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
