export interface MediaItem {
  id: number;
  title: string;
  poster: string | null;
  year: number;
  rating: number;
  tmdbId: number | null;
  type: string;
}

export interface Category {
  key: string;
  label: string;
  sourceId: number;
  region?: string;
}

export const categories: Category[] = [
  { key: "netflix", label: "Netflix", sourceId: 203 },
  { key: "prime", label: "Prime Video", sourceId: 26 },
  { key: "hulu", label: "Hulu", sourceId: 157 },
  { key: "hbomax", label: "HBO Max", sourceId: 387 },
  { key: "dplus", label: "Disney+", sourceId: 372 },
  { key: "appletv", label: "Apple TV+", sourceId: 371 },
  { key: "crunchyroll", label: "Crunchyroll", sourceId: 80 },
  { key: "shudder", label: "Shudder", sourceId: 252 },
  { key: "paramount", label: "Paramount+", sourceId: 582 },
  { key: "peacock", label: "Peacock", sourceId: 559 },
  { key: "viki", label: "Viki", sourceId: 471 },
  { key: "hayu", label: "Hayu", sourceId: 392, region: "GB" },
  { key: "curiosity", label: "CuriosityStream", sourceId: 421 },
  { key: "criterion", label: "Criterion Channel", sourceId: 366 },
  { key: "britbox", label: "BritBox", sourceId: 376 },
  { key: "acorn", label: "Acorn TV", sourceId: 17 },
  { key: "lionsgate", label: "Lionsgate+", sourceId: 533, region: "GB" },
];

export const brandColors: Record<string, string> = {
  netflix: "#e50914",
  prime: "#ff9900",
  hulu: "#1ce783",
  hbomax: "#5822b4",
  dplus: "#113cc2",
  appletv: "#555",
  crunchyroll: "#f47521",
  shudder: "#ee3a3a",
  paramount: "#006fa6",
  peacock: "#00a78e",
  viki: "#1ab7ea",
  hayu: "#e31b54",
  curiosity: "#0d6e4b",
  criterion: "#000",
  britbox: "#003b5c",
  acorn: "#6bb24a",
  lionsgate: "#000",
};

export function brandLetter(key: string): string {
  const letters: Record<string, string> = {
    netflix: "N",
    prime: "▶",
    hulu: "H",
    hbomax: "Mx",
    dplus: "D+",
    appletv: "A+",
    crunchyroll: "Cr",
    shudder: "Sh",
    paramount: "P",
    peacock: "Pk",
    viki: "V",
    hayu: "Hy",
    curiosity: "C?",
    criterion: "CC",
    britbox: "BB",
    acorn: "Ac",
    lionsgate: "L+",
  };
  return letters[key] || key.charAt(0).toUpperCase();
}
