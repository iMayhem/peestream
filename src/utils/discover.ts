export interface MediaItem {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  release_date: string;
  type: "movie" | "tv";
}

export interface Category {
  key: string;
  label: string;
  params: Record<string, string | number>;
  isTv?: boolean;
}

export const categories: Category[] = [
  { key: "now-playing", label: "Now Playing", params: { sort_by: "popularity.desc" } },
  { key: "top-rated", label: "Top Rated", params: { sort_by: "vote_average.desc", "vote_count.gte": 500 } },
  { key: "most-popular", label: "Most Popular", params: { sort_by: "popularity.desc" } },
  { key: "marvel", label: "Marvel", params: { with_companies: "420", sort_by: "popularity.desc" } },
  { key: "dc", label: "DC", params: { with_companies: "429|9993", sort_by: "popularity.desc" } },
  { key: "warner", label: "Warner Bros.", params: { with_companies: "174", sort_by: "popularity.desc" } },
  { key: "universal", label: "Universal", params: { with_companies: "33", sort_by: "popularity.desc" } },
  { key: "disney", label: "Disney", params: { with_companies: "2", sort_by: "popularity.desc" } },
  { key: "sony", label: "Sony", params: { with_companies: "559", sort_by: "popularity.desc" } },
  { key: "paramount", label: "Paramount", params: { with_companies: "4", sort_by: "popularity.desc" } },
  { key: "lionsgate", label: "Lionsgate", params: { with_companies: "13827", sort_by: "popularity.desc" } },
  { key: "a24", label: "A24", params: { with_companies: "41077", sort_by: "popularity.desc" } },
  { key: "pixar", label: "Pixar", params: { with_companies: "3", sort_by: "popularity.desc" } },
  { key: "dreamworks", label: "DreamWorks", params: { with_companies: "521", sort_by: "popularity.desc" } },
  { key: "focus", label: "Focus Features", params: { with_companies: "10163", sort_by: "popularity.desc" } },
  { key: "netflix", label: "Netflix TV", params: { with_networks: "213", sort_by: "popularity.desc" }, isTv: true },
  { key: "hbo", label: "HBO", params: { with_networks: "49", sort_by: "popularity.desc" }, isTv: true },
  { key: "disneyplus", label: "Disney+", params: { with_networks: "2739", sort_by: "popularity.desc" }, isTv: true },
  { key: "appletv", label: "Apple TV+", params: { with_networks: "2552", sort_by: "popularity.desc" }, isTv: true },
  { key: "amazon", label: "Amazon", params: { with_networks: "1024", sort_by: "popularity.desc" }, isTv: true },
  { key: "hulu", label: "Hulu", params: { with_networks: "453", sort_by: "popularity.desc" }, isTv: true },
];

export const brandColors: Record<string, string> = {
  marvel: "#ed1d24",
  dc: "#0477f2",
  warner: "#00aeef",
  universal: "#000",
  disney: "#113cc2",
  sony: "#000",
  paramount: "#006fa6",
  a24: "#000",
  lionsgate: "#000",
  pixar: "#0071bc",
  dreamworks: "#f8981d",
  focus: "#f5a623",
  netflix: "#e50914",
  hbo: "#5822b4",
  disneyplus: "#113cc2",
  appletv: "#555",
  amazon: "#ff9900",
  hulu: "#1ce783",
};

export function brandLetter(key: string): string {
  const letters: Record<string, string> = {
    "now-playing": "NP",
    "top-rated": "TR",
    "most-popular": "MP",
    a24: "A24",
    focus: "Fc",
    hbo: "HBO",
    disneyplus: "D+",
    appletv: "A+",
    amazon: "▶",
    universal: "U",
    sony: "S",
    paramount: "P",
    lionsgate: "L",
    pixar: "Px",
    dreamworks: "Dw",
    netflix: "N",
    hulu: "H",
  };
  return letters[key] || key.charAt(0).toUpperCase();
}
