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
    });
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
    const items = json.results?.[0]?.streams?.[0]?._languageVariants ?? [];
    return items.map((v: any) => ({
      language: v.language ?? "unknown",
      label: v.label ?? v.language ?? "Unknown",
      id: v.id ?? "",
      type: v.type ?? type,
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
