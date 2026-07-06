import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { get } from "@/backend/metadata/tmdb";
import { ThiccContainer } from "@/components/layout/ThinContainer";
import { Divider } from "@/components/utils/Divider";
import { Flare } from "@/components/utils/Flare";
import { conf } from "@/setup/config";
import {
  Category,
  Genre,
  Media,
  Movie,
  TVShow,
  categories,
  tvCategories,
} from "@/utils/discover";

import { SubPageLayout } from "./layouts/SubPageLayout";
import { Icon, Icons } from "../components/Icon";
import { PageTitle } from "./parts/util/PageTitle";

const TMDB_IMG = "https://image.tmdb.org/t/p/w500";

const brandColors: Record<string, string> = {
  Marvel: "#ed1d24",
  DC: "#0477f2",
  "Warner Bros.": "#00aeef",
  Universal: "#000",
  Disney: "#113cc2",
  Sony: "#000",
  Paramount: "#006fa6",
  A24: "#000",
  Lionsgate: "#000",
  DreamWorks: "#f8981d",
  Pixar: "#0071bc",
  Netflix: "#e50914",
  HBO: "#5822b4",
  "Disney+": "#113cc2",
  "Apple TV+": "#555",
  Amazon: "#ff9900",
  Hulu: "#1ce783",
};

async function fetchCategoryMovies(category: Category): Promise<any[]> {
  try {
    let data: any;
    if (category.endpoint) {
      data = await get<any>(category.endpoint, {
        api_key: conf().TMDB_READ_API_KEY,
        language: "en-US",
      });
    } else if (category.discoverParams) {
      const endpoint = category.isTV ? "/discover/tv" : "/discover/movie";
      data = await get<any>(endpoint, {
        api_key: conf().TMDB_READ_API_KEY,
        language: "en-US",
        ...category.discoverParams,
      });
    }
    const results = data?.results ?? [];
    for (let i = results.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [results[i], results[j]] = [results[j], results[i]];
    }
    return results;
  } catch (error) {
    console.error(`Error fetching category ${category.name}:`, error);
    return [];
  }
}

export function Discover() {
  const { t } = useTranslation();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [randomMovie, setRandomMovie] = useState<Movie | null>(null);
  const [genreMovies, setGenreMovies] = useState<{
    [genreId: number]: Movie[];
  }>({});
  const [countdown, setCountdown] = useState<number | null>(null);
  const navigate = useNavigate();
  const [categoryShows, setCategoryShows] = useState<{
    [categoryName: string]: Movie[];
  }>({});
  const [categoryMovies, setCategoryMovies] = useState<{
    [categoryName: string]: Movie[];
  }>({});
  const [tvGenres, setTVGenres] = useState<Genre[]>([]);
  const [tvShowGenres, setTVShowGenres] = useState<{
    [genreId: number]: TVShow[];
  }>({});
  const carouselRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [countdownTimeout, setCountdownTimeout] =
    useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    categories.forEach(async (cat) => {
      const results = await fetchCategoryMovies(cat);
      setCategoryMovies((prev) => ({ ...prev, [cat.name]: results }));
    });
  }, []);

  useEffect(() => {
    tvCategories.forEach(async (cat) => {
      const results = await fetchCategoryMovies(cat);
      setCategoryShows((prev) => ({ ...prev, [cat.name]: results }));
    });
  }, []);

  useEffect(() => {
    const fetchTVGenres = async () => {
      try {
        const data = await get<any>("/genre/tv/list", {
          api_key: conf().TMDB_READ_API_KEY,
          language: "en-US",
        });
        for (let i = data.genres.length - 1; i > 0; i -= 1) {
          const j = Math.floor(Math.random() * (i + 1));
          [data.genres[i], data.genres[j]] = [data.genres[j], data.genres[i]];
        }
        setTVGenres(data.genres.slice(0, 6));
      } catch (error) {
        console.error("Error fetching TV show genres:", error);
      }
    };
    fetchTVGenres();
  }, []);

  useEffect(() => {
    const fetchTVShowsForGenre = async (genreId: number) => {
      try {
        const data = await get<any>("/discover/tv", {
          api_key: conf().TMDB_READ_API_KEY,
          with_genres: genreId.toString(),
          language: "en-US",
        });
        for (let i = data.results.length - 1; i > 0; i -= 1) {
          const j = Math.floor(Math.random() * (i + 1));
          [data.results[i], data.results[j]] = [
            data.results[j],
            data.results[i],
          ];
        }
        setTVShowGenres((prev) => ({ ...prev, [genreId]: data.results }));
      } catch (error) {
        console.error(`Error fetching TV shows for genre ${genreId}:`, error);
      }
    };
    tvGenres.forEach((genre) => fetchTVShowsForGenre(genre.id));
  }, [tvGenres]);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const data = await get<any>("/genre/movie/list", {
          api_key: conf().TMDB_READ_API_KEY,
          language: "en-US",
        });
        for (let i = data.genres.length - 1; i > 0; i -= 1) {
          const j = Math.floor(Math.random() * (i + 1));
          [data.genres[i], data.genres[j]] = [data.genres[j], data.genres[i]];
        }
        setGenres(data.genres.slice(0, 4));
      } catch (error) {
        console.error("Error fetching genres:", error);
      }
    };
    fetchGenres();
  }, []);

  useEffect(() => {
    const fetchMoviesForGenre = async (genreId: number) => {
      try {
        const movies: any[] = [];
        for (let page = 1; page <= 4; page += 1) {
          const data = await get<any>("/discover/movie", {
            api_key: conf().TMDB_READ_API_KEY,
            with_genres: genreId.toString(),
            language: "en-US",
            page: page.toString(),
          });
          movies.push(...data.results);
        }
        for (let i = movies.length - 1; i > 0; i -= 1) {
          const j = Math.floor(Math.random() * (i + 1));
          [movies[i], movies[j]] = [movies[j], movies[i]];
        }
        setGenreMovies((prev) => ({ ...prev, [genreId]: movies }));
      } catch (error) {
        console.error(`Error fetching movies for genre ${genreId}:`, error);
      }
    };
    genres.forEach((genre) => fetchMoviesForGenre(genre.id));
  }, [genres]);

  function scrollCarousel(categorySlug: string, direction: string) {
    const carousel = carouselRefs.current[categorySlug];
    if (carousel) {
      const movieElements = carousel.getElementsByTagName("a");
      if (movieElements.length > 0) {
        const movieWidth = movieElements[0].offsetWidth;
        const visibleMovies = Math.floor(carousel.offsetWidth / movieWidth);
        const scrollAmount = movieWidth * visibleMovies * 0.69;
        if (direction === "left") {
          carousel.scrollBy({ left: -scrollAmount, behavior: "smooth" });
        } else {
          carousel.scrollBy({ left: scrollAmount, behavior: "smooth" });
        }
      }
    }
  }

  const [movieWidth, setMovieWidth] = useState(
    window.innerWidth < 600 ? "150px" : "200px",
  );

  useEffect(() => {
    const handleResize = () => {
      setMovieWidth(window.innerWidth < 600 ? "150px" : "200px");
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function renderMovies(medias: Media[], category: string, isTVShow = false) {
    const prefix = isTVShow ? "tv" : "movie";
    const categorySlug = `${prefix}-${category.toLowerCase().replace(/ /g, "-")}`;
    const displayCategory = isTVShow
      ? `${category} Shows`
      : `${category} Movies`;

    const accent = brandColors[category];

    return (
      <div className="relative overflow-hidden mt-2">
        <div className="flex items-center gap-3 pl-5 mb-1">
          {accent && (
            <div
              className="w-1 h-6 rounded-full"
              style={{ backgroundColor: accent }}
            />
          )}
          <h2 className="text-2xl cursor-default font-bold text-white sm:text-3xl md:text-2xl">
            {displayCategory}
          </h2>
        </div>
        <div
          id={`carousel-${categorySlug}`}
          className="flex whitespace-nowrap pt-4 overflow-auto scrollbar rounded-xl overflow-y-hidden"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "transparent transparent",
          }}
          ref={(el) => {
            carouselRefs.current[categorySlug] = el;
          }}
        >
          {medias
            .filter((media, index, self) => {
              return (
                index ===
                self.findIndex(
                  (m) => m.id === media.id && m.title === media.title,
                )
              );
            })
            .slice(0, 20)
            .map((media) => (
              <a
                key={media.id}
                onClick={() =>
                  navigate(
                    `/media/tmdb-${isTVShow ? "tv" : "movie"}-${media.id}-${
                      isTVShow ? media.name : media.title
                    }`,
                  )
                }
                className="text-center relative mt-3 mx-[0.285em] mb-3 transition-transform hover:scale-105 duration-[0.45s]"
                style={{ flex: `0 0 ${movieWidth}` }}
              >
                <Flare.Base className="group cursor-pointer rounded-xl relative p-[0.65em] bg-background-main transition-colors duration-300 bg-transparent">
                  <Flare.Light
                    flareSize={300}
                    cssColorVar="--colors-mediaCard-hoverAccent"
                    backgroundClass="bg-mediaCard-hoverBackground duration-200"
                    className="rounded-xl bg-background-main group-hover:opacity-100"
                  />
                  {media.poster_path ? (
                    <img
                      src={`${TMDB_IMG}${media.poster_path}`}
                      alt=""
                      loading="lazy"
                      className="rounded-xl relative"
                    />
                  ) : (
                    <div className="rounded-xl relative w-full aspect-[2/3] bg-white/5 flex items-center justify-center">
                      <Icon
                        icon={Icons.MOVIE_WEB}
                        className="text-4xl opacity-30"
                      />
                    </div>
                  )}
                  <h1 className="group relative pt-2 text-[13.5px] whitespace-normal duration-[0.35s] font-semibold text-white opacity-0 group-hover:opacity-100">
                    {(isTVShow ? media.name : media.title) ?? ""}
                  </h1>
                </Flare.Base>
              </a>
            ))}
        </div>

        <div className="flex items-center justify-center">
          <button
            type="button"
            title="Back"
            className="absolute left-5 top-1/2 transform -translate-y-3/4 z-10"
            onClick={() => scrollCarousel(categorySlug, "left")}
          >
            <div className="cursor-pointer text-white flex justify-center items-center h-10 w-10 rounded-full bg-search-hoverBackground active:scale-110 transition-[transform,background-color] duration-200">
              <Icon icon={Icons.ARROW_LEFT} />
            </div>
          </button>
          <button
            type="button"
            title="Next"
            className="absolute right-5 top-1/2 transform -translate-y-3/4 z-10"
            onClick={() => scrollCarousel(categorySlug, "right")}
          >
            <div className="cursor-pointer text-white flex justify-center items-center h-10 w-10 rounded-full bg-search-hoverBackground active:scale-110 transition-[transform,background-color] duration-200">
              <Icon icon={Icons.ARROW_RIGHT} />
            </div>
          </button>
        </div>
      </div>
    );
  }

  const handleRandomMovieClick = () => {
    const allMovies = Object.values(genreMovies).flat();
    const uniqueTitles = new Set<string>();
    allMovies.forEach((movie) => uniqueTitles.add(movie.title));
    const uniqueTitlesArray = Array.from(uniqueTitles);
    const randomIndex = Math.floor(Math.random() * uniqueTitlesArray.length);
    const selectedMovie = allMovies.find(
      (movie) => movie.title === uniqueTitlesArray[randomIndex],
    );

    if (selectedMovie) {
      setRandomMovie(selectedMovie);

      if (countdown !== null && countdown > 0) {
        setCountdown(null);
        if (countdownTimeout) {
          clearTimeout(countdownTimeout);
          setCountdownTimeout(null);
          setRandomMovie(null);
        }
      } else {
        setCountdown(5);

        const timeoutId = setTimeout(() => {
          navigate(
            `/media/tmdb-movie-${selectedMovie.id}-${selectedMovie.title}`,
          );
        }, 5000);
        setCountdownTimeout(timeoutId);
      }
    }
  };

  useEffect(() => {
    let countdownInterval: NodeJS.Timeout;
    if (countdown !== null && countdown > 0) {
      countdownInterval = setInterval(() => {
        setCountdown((prevCountdown) =>
          prevCountdown !== null ? prevCountdown - 1 : prevCountdown,
        );
      }, 1000);
    }

    return () => {
      clearInterval(countdownInterval);
    };
  }, [countdown]);

  return (
    <SubPageLayout>
      <div className="mb-16 sm:mb-2">
        <Helmet>
          <style type="text/css">{`
            html, body {
              scrollbar-width: none;
              -ms-overflow-style: none;
            }
          `}</style>
        </Helmet>
        <PageTitle subpage k="global.pages.discover" />
        <div className="mt-44 space-y-16 text-center">
          <div className="relative z-10 mb-16">
            <h1 className="text-4xl cursor-default font-bold text-white">
              {t("global.pages.discover")}
            </h1>
          </div>
        </div>
      </div>
      <ThiccContainer>
        <div className="flex items-center justify-center mb-6">
          <button
            type="button"
            className="flex items-center space-x-2 rounded-full px-4 text-white py-2 bg-pill-background bg-opacity-50 hover:bg-pill-backgroundHover transition-[background,transform] duration-100 hover:scale-105"
            onClick={handleRandomMovieClick}
          >
            <span className="flex items-center">
              {countdown !== null && countdown > 0 ? (
                <div className="flex items-center inline-block">
                  <span>Cancel Countdown</span>
                  <Icon
                    icon={Icons.X}
                    className="text-2xl ml-[4.5px] mb-[-0.7px]"
                  />
                </div>
              ) : (
                <div className="flex items-center inline-block">
                  <span>Watch Something New</span>
                  <img
                    src="/lightbar-images/dice.svg"
                    alt="Small Image"
                    style={{
                      marginLeft: "8px",
                    }}
                  />
                </div>
              )}
            </span>
          </button>
        </div>
        {randomMovie && (
          <div className="mt-4 mb-4 text-center">
            <p>
              Now Playing <span className="font-bold">{randomMovie.title}</span>{" "}
              in {countdown}
            </p>
          </div>
        )}
        <div className="flex flex-col">
          {categories.map((category) => (
            <div
              key={category.name}
              id={`carousel-${category.name.toLowerCase().replace(/ /g, "-")}`}
              className="mt-8"
            >
              {renderMovies(categoryMovies[category.name] || [], category.name)}
            </div>
          ))}
          {genres.map((genre) => (
            <div
              key={`${genre.id}|${genre.name}`}
              id={`carousel-${genre.name.toLowerCase().replace(/ /g, "-")}`}
              className="mt-8"
            >
              {renderMovies(genreMovies[genre.id] || [], genre.name)}
            </div>
          ))}
          <div className="flex items-center">
            <Divider marginClass="mr-5" />
            <h1 className="text-4xl font-bold text-white mx-auto">Shows</h1>
            <Divider marginClass="ml-5" />
          </div>
          {tvCategories.map((category) => (
            <div
              key={category.name}
              id={`carousel-${category.name.toLowerCase().replace(/ /g, "-")}`}
              className="mt-8"
            >
              {renderMovies(
                categoryShows[category.name] || [],
                category.name,
                true,
              )}
            </div>
          ))}
          {tvGenres.map((genre) => (
            <div
              key={`${genre.id}|${genre.name}`}
              id={`carousel-${genre.name.toLowerCase().replace(/ /g, "-")}`}
              className="mt-8"
            >
              {renderMovies(tvShowGenres[genre.id] || [], genre.name, true)}
            </div>
          ))}
        </div>
      </ThiccContainer>
    </SubPageLayout>
  );
}
