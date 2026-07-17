import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { get as tmdbGet } from "@/backend/metadata/tmdb";
import { Icon, Icons } from "@/components/Icon";
import { Category } from "@/utils/discover";

interface HomeMediaItem {
  id: number;
  title: string;
  poster: string | null;
  rating: number;
  type: "movie" | "tv";
}

function PosterCard({
  item,
  onClick,
}: {
  item: HomeMediaItem;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full text-left focus:outline-none"
    >
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-white/5">
        {item.poster ? (
          <img
            src={item.poster}
            alt={item.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/20 text-lg font-bold">
            {item.title.charAt(0)}
          </div>
        )}
        {item.rating > 0 && (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/70 text-[11px] font-bold text-amber-400 leading-tight">
            {item.rating.toFixed(1)}
          </div>
        )}
      </div>
      <p className="mt-1.5 text-sm text-white/80 truncate px-0.5">
        {item.title}
      </p>
    </button>
  );
}

function SkeletonCard() {
  return (
    <div className="w-32 sm:w-36 flex-shrink-0">
      <div className="animate-pulse rounded-xl bg-white/5 aspect-[2/3]" />
      <div className="mt-1.5 h-4 bg-white/5 rounded animate-pulse" />
    </div>
  );
}

export function CategoryRowPart({ category }: { category: Category }) {
  const [items, setItems] = useState<HomeMediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollRight = useCallback(() => {
    scrollRef.current?.scrollBy({ left: 600, behavior: "smooth" });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const endpoint =
      category.endpoint || (category.isTv ? "discover/tv" : "discover/movie");
    const params: Record<string, string | number> = { page: 1 };
    if (category.discoverParams) {
      Object.assign(params, category.discoverParams);
    }

    tmdbGet<any>(endpoint, params)
      .then((data) => {
        if (cancelled) return;
        const results = data?.results ?? [];
        setItems(
          results.map((r: any) => ({
            id: r.id,
            title: r.title || r.name || "",
            poster: r.poster_path
              ? `https://providers.peestream.in/tmdb-image/w500${r.poster_path}`
              : null,
            rating: r.vote_average || 0,
            type: category.isTv ? ("tv" as const) : ("movie" as const),
          })),
        );
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [category]);

  const mediaType = (item: HomeMediaItem) => item.type;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-white">{category.label}</h2>
        <button
          type="button"
          onClick={() => navigate("/discover")}
          className="text-sm font-medium text-type-dimmed hover:text-white transition-colors duration-100"
        >
          More
        </button>
      </div>
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-2"
          style={{ scrollbarWidth: "none" }}
        >
          {loading
            ? Array.from({ length: 8 }).map((_, i) => {
                // eslint-disable-next-line react/no-array-index-key
                return <SkeletonCard key={i} />;
              })
            : items.map((item) => (
                <div key={item.id} className="w-32 sm:w-36 flex-shrink-0">
                  <PosterCard
                    item={item}
                    onClick={() =>
                      navigate(
                        `/media/tmdb-${mediaType(item)}-${item.id}-${item.title}`,
                      )
                    }
                  />
                </div>
              ))}
        </div>
        <button
          type="button"
          onClick={scrollRight}
          className="absolute right-0 top-0 bottom-2 w-12 flex items-center justify-center bg-gradient-to-l from-background to-transparent text-white/60 hover:text-white transition-colors duration-100"
        >
          <Icon icon={Icons.CHEVRON_RIGHT} className="text-2xl" />
        </button>
      </div>
    </section>
  );
}
