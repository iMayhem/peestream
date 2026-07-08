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
  type: "tmdb" | "watchmode";
  sourceId?: number;
  region?: string;
  endpoint?: string;
  discoverParams?: Record<string, string | number>;
  isTv?: boolean;
}

export const categories: Category[] = [
  {
    key: "trending",
    label: "Trending",
    type: "tmdb",
    endpoint: "trending/movie/week",
  },
  {
    key: "trending-tv",
    label: "Trending TV",
    type: "tmdb",
    endpoint: "trending/tv/week",
    isTv: true,
  },
  {
    key: "highest-grossing",
    label: "Highest Grossing",
    type: "tmdb",
    endpoint: "discover/movie",
    discoverParams: { sort_by: "revenue.desc" },
  },
  {
    key: "most-voted",
    label: "Most Voted",
    type: "tmdb",
    endpoint: "discover/movie",
    discoverParams: { sort_by: "vote_count.desc" },
  },
  {
    key: "top-rated",
    label: "Top Rated",
    type: "tmdb",
    endpoint: "discover/movie",
    discoverParams: { sort_by: "vote_average.desc", "vote_count.gte": 500 },
  },
  {
    key: "marvel",
    label: "Marvel",
    type: "tmdb",
    endpoint: "discover/movie",
    discoverParams: { with_companies: "420" },
  },
  {
    key: "dc",
    label: "DC",
    type: "tmdb",
    endpoint: "discover/movie",
    discoverParams: { with_companies: "429|9993" },
  },
  {
    key: "warner",
    label: "Warner Bros.",
    type: "tmdb",
    endpoint: "discover/movie",
    discoverParams: { with_companies: "174" },
  },
  {
    key: "universal",
    label: "Universal",
    type: "tmdb",
    endpoint: "discover/movie",
    discoverParams: { with_companies: "33" },
  },
  {
    key: "disney",
    label: "Disney",
    type: "tmdb",
    endpoint: "discover/movie",
    discoverParams: { with_companies: "2" },
  },
  {
    key: "sony",
    label: "Sony",
    type: "tmdb",
    endpoint: "discover/movie",
    discoverParams: { with_companies: "559" },
  },
  {
    key: "paramount-studio",
    label: "Paramount",
    type: "tmdb",
    endpoint: "discover/movie",
    discoverParams: { with_companies: "4" },
  },
  {
    key: "a24",
    label: "A24",
    type: "tmdb",
    endpoint: "discover/movie",
    discoverParams: { with_companies: "41077" },
  },
  {
    key: "focus",
    label: "Focus Features",
    type: "tmdb",
    endpoint: "discover/movie",
    discoverParams: { with_companies: "10163" },
  },
  {
    key: "dreamworks",
    label: "DreamWorks",
    type: "tmdb",
    endpoint: "discover/movie",
    discoverParams: { with_companies: "521" },
  },
  {
    key: "pixar",
    label: "Pixar",
    type: "tmdb",
    endpoint: "discover/movie",
    discoverParams: { with_companies: "3" },
  },

  {
    key: "netflix",
    label: "Netflix",
    type: "watchmode",
    sourceId: 203,
  },
  {
    key: "prime",
    label: "Prime Video",
    type: "watchmode",
    sourceId: 26,
  },
  {
    key: "hulu",
    label: "Hulu",
    type: "watchmode",
    sourceId: 157,
  },
  {
    key: "hbomax",
    label: "HBO Max",
    type: "watchmode",
    sourceId: 387,
  },
  {
    key: "dplus",
    label: "Disney+",
    type: "watchmode",
    sourceId: 372,
  },
  {
    key: "appletv",
    label: "Apple TV+",
    type: "watchmode",
    sourceId: 371,
  },
  {
    key: "crunchyroll",
    label: "Crunchyroll",
    type: "watchmode",
    sourceId: 80,
  },
  {
    key: "shudder",
    label: "Shudder",
    type: "watchmode",
    sourceId: 252,
  },
  {
    key: "viki",
    label: "Viki",
    type: "watchmode",
    sourceId: 471,
  },
  {
    key: "hayu",
    label: "Hayu",
    type: "watchmode",
    sourceId: 392,
    region: "GB",
  },
  {
    key: "curiosity",
    label: "CuriosityStream",
    type: "watchmode",
    sourceId: 421,
  },
  {
    key: "criterion",
    label: "Criterion Channel",
    type: "watchmode",
    sourceId: 366,
  },
  {
    key: "britbox",
    label: "BritBox",
    type: "watchmode",
    sourceId: 376,
  },
  {
    key: "acorn",
    label: "Acorn TV",
    type: "watchmode",
    sourceId: 17,
  },
  {
    key: "lionsgate",
    label: "Lionsgate+",
    type: "watchmode",
    sourceId: 533,
    region: "GB",
  },
];

export const brandColors: Record<string, string> = {
  trending: "#f59e0b",
  "trending-tv": "#f59e0b",
  "highest-grossing": "#10b981",
  "most-voted": "#3b82f6",
  "top-rated": "#fbbf24",
  marvel: "#ed1d24",
  dc: "#0477f2",
  warner: "#00aeef",
  universal: "#333",
  disney: "#113cc2",
  sony: "#333",
  "paramount-studio": "#006fa6",
  a24: "#333",
  focus: "#f5a623",
  dreamworks: "#f8981d",
  pixar: "#0071bc",

  netflix: "#e50914",
  prime: "#ff9900",
  hulu: "#1ce783",
  hbomax: "#5822b4",
  dplus: "#113cc2",
  appletv: "#555",
  crunchyroll: "#f47521",
  shudder: "#ee3a3a",
  viki: "#1ab7ea",
  hayu: "#e31b54",
  curiosity: "#0d6e4b",
  criterion: "#333",
  britbox: "#003b5c",
  acorn: "#6bb24a",
  lionsgate: "#333",
};

export function brandLetter(key: string): string {
  const letters: Record<string, string> = {
    trending: "Tr",
    "trending-tv": "TV",
    "highest-grossing": "$$",
    "most-voted": "✓",
    "top-rated": "★",
    marvel: "M",
    dc: "DC",
    warner: "WB",
    universal: "U",
    disney: "D",
    sony: "S",
    "paramount-studio": "P",
    a24: "A24",
    focus: "Fc",
    dreamworks: "DW",
    pixar: "Px",

    netflix: "N",
    prime: "▶",
    hulu: "H",
    hbomax: "Mx",
    dplus: "D+",
    appletv: "A+",
    crunchyroll: "Cr",
    shudder: "Sh",
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
