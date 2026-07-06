export interface Media {
  id: number;
  poster_path: string;
  title?: string;
  name?: string;
  vote_average?: number;
}

export interface Movie extends Media {
  title: string;
}

export interface TVShow extends Media {
  name: string;
}

export interface Genre {
  id: number;
  name: string;
}

export interface Category {
  name: string;
  endpoint?: string;
  discoverParams?: Record<string, string>;
  isTV?: boolean;
}

export const categories: Category[] = [
  { name: "Now Playing", endpoint: "/movie/now_playing?language=en-US" },
  { name: "Top Rated", endpoint: "/movie/top_rated?language=en-US" },
  { name: "Most Popular", endpoint: "/movie/popular?language=en-US" },
  {
    name: "Marvel",
    discoverParams: { with_companies: "420", sort_by: "popularity.desc" },
  },
  {
    name: "DC",
    discoverParams: { with_companies: "429|9993", sort_by: "popularity.desc" },
  },
  {
    name: "Warner Bros.",
    discoverParams: { with_companies: "174", sort_by: "popularity.desc" },
  },
  {
    name: "Universal",
    discoverParams: { with_companies: "33", sort_by: "popularity.desc" },
  },
  {
    name: "Disney",
    discoverParams: { with_companies: "2", sort_by: "popularity.desc" },
  },
  {
    name: "Sony",
    discoverParams: { with_companies: "559", sort_by: "popularity.desc" },
  },
  {
    name: "Paramount",
    discoverParams: { with_companies: "4", sort_by: "popularity.desc" },
  },
  {
    name: "A24",
    discoverParams: { with_companies: "41077", sort_by: "popularity.desc" },
  },
  {
    name: "Lionsgate",
    discoverParams: { with_companies: "13827", sort_by: "popularity.desc" },
  },
  {
    name: "DreamWorks",
    discoverParams: { with_companies: "521", sort_by: "popularity.desc" },
  },
  {
    name: "Pixar",
    discoverParams: { with_companies: "3", sort_by: "popularity.desc" },
  },
];

export const tvCategories: Category[] = [
  { name: "Top Rated", endpoint: "/tv/top_rated?language=en-US" },
  { name: "Most Popular", endpoint: "/tv/popular?language=en-US" },
  {
    name: "Marvel",
    discoverParams: { with_companies: "420", sort_by: "popularity.desc" },
    isTV: true,
  },
  {
    name: "DC",
    discoverParams: { with_companies: "429|9993", sort_by: "popularity.desc" },
    isTV: true,
  },
  {
    name: "Warner Bros.",
    discoverParams: { with_companies: "174", sort_by: "popularity.desc" },
    isTV: true,
  },
  {
    name: "Netflix",
    discoverParams: { with_networks: "213", sort_by: "popularity.desc" },
    isTV: true,
  },
  {
    name: "HBO",
    discoverParams: { with_networks: "49", sort_by: "popularity.desc" },
    isTV: true,
  },
  {
    name: "Disney+",
    discoverParams: { with_networks: "2739", sort_by: "popularity.desc" },
    isTV: true,
  },
  {
    name: "Apple TV+",
    discoverParams: { with_networks: "2552", sort_by: "popularity.desc" },
    isTV: true,
  },
  {
    name: "Amazon",
    discoverParams: { with_networks: "1024", sort_by: "popularity.desc" },
    isTV: true,
  },
  {
    name: "Hulu",
    discoverParams: { with_networks: "453", sort_by: "popularity.desc" },
    isTV: true,
  },
];
