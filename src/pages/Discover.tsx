import { useCallback, useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";

import { proxiedFetch } from "@/backend/helpers/fetch";
import {
  Category,
  MediaItem,
  brandColors,
  brandLetter,
  categories,
} from "@/utils/discover";

import { SubPageLayout } from "./layouts/SubPageLayout";
import { PageTitle } from "./parts/util/PageTitle";

const WATCHMODE_KEY = "wr6fJOVgJsUyexE1otCdyajF06PW6zTibu2yOWnR";

function SkeletonCard() {
  return <div className="animate-pulse rounded-xl bg-white/5 aspect-[2/3]" />;
}

function PosterCard({
  item,
  onClick,
}: {
  item: MediaItem;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative w-full text-left focus:outline-none"
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

async function fetchPage(
  cat: Category,
  page: number,
): Promise<{ items: MediaItem[]; totalPages: number }> {
  const params: Record<string, string> = {
    apiKey: WATCHMODE_KEY,
    source_ids: String(cat.sourceId),
    page: String(page),
    limit: "50",
  };
  if (cat.region) params.regions = cat.region;
  const data = await proxiedFetch<any>("/v1/list-titles/", {
    baseURL: "https://api.watchmode.com",
    params,
  });
  const items: MediaItem[] = (data?.titles ?? []).map((r: any) => ({
    id: r.id,
    title: r.title || "",
    poster: r.poster ?? null,
    year: r.year || 0,
    rating: r.rating || 0,
    tmdbId: r.tmdb_id ?? null,
    type: r.type || "movie",
  }));
  return { items, totalPages: Math.min(data?.total_pages ?? 1, 500) };
}

export function Discover() {
  const navigate = useNavigate();
  const [activeKey, setActiveKey] = useState(categories[0].key);
  const [results, setResults] = useState<MediaItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const loadPage = useCallback(
    async (cat: Category, p: number, append: boolean) => {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
        setResults([]);
      }
      try {
        const { items, totalPages: tp } = await fetchPage(cat, p);
        if (append) {
          setResults((prev) => {
            const existingIds = new Set(prev.map((r) => r.id));
            const fresh = items.filter((i) => !existingIds.has(i.id));
            return [...prev, ...fresh];
          });
        } else {
          setResults(items);
        }
        setTotalPages(tp);
        setPage(p);
      } catch {
        if (!append) setResults([]);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [],
  );

  useEffect(() => {
    const cat = categories.find((c) => c.key === activeKey) || categories[0];
    loadPage(cat, 1, false);
  }, [activeKey, loadPage]);

  const hasMore = page < totalPages;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || isLoadingMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          setIsLoadingMore(true);
          const cat =
            categories.find((c) => c.key === activeKey) || categories[0];
          loadPage(cat, page + 1, true);
        }
      },
      { rootMargin: "480px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, activeKey, page, loadPage]);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <SubPageLayout>
      <Helmet>
        <style>{`
          html, body { scrollbar-width: none; -ms-overflow-style: none; }
        `}</style>
      </Helmet>
      <PageTitle subpage k="global.pages.discover" />

      <div className="sticky top-0 z-30 bg-background-main/80 backdrop-blur-md border-b border-white/5">
        <div
          className="flex gap-2 overflow-x-auto px-4 py-3"
          style={{ scrollbarWidth: "none" }}
        >
          {categories.map((cat) => {
            const isActive = activeKey === cat.key;
            const accent = brandColors[cat.key];
            const letter = brandLetter(cat.key);
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActiveKey(cat.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                  isActive
                    ? "bg-[rgba(255,90,31,0.12)] text-[#ff5a1f] border border-[#ff5a1f]/40"
                    : "bg-white/5 text-white/60 border border-white/10 hover:border-white/30 hover:text-white/90"
                }`}
              >
                {accent ? (
                  <span
                    className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: accent }}
                  >
                    {letter}
                  </span>
                ) : (
                  <span className="text-xs">{letter}</span>
                )}
                <span>{cat.label}</span>
                {cat.region && (
                  <span className="text-[10px] px-1 py-0.5 rounded-full bg-white/10 text-white/40 font-semibold leading-tight">
                    {cat.region}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 py-6 max-w-7xl mx-auto">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 20 }).map((_, i) => {
              // eslint-disable-next-line react/no-array-index-key
              return <SkeletonCard key={i} />;
            })}
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-20 text-white/40">
            No results found.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {results.map((item) => (
                <PosterCard
                  key={`${item.type}-${item.id}`}
                  item={item}
                  onClick={() =>
                    navigate(
                      `/media/tmdb-${item.type === "tv_series" || item.type === "tv_miniseries" ? "tv" : "movie"}-${item.tmdbId || item.id}-${item.title}`,
                    )
                  }
                />
              ))}
            </div>

            {isLoadingMore && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mt-4">
                {Array.from({ length: 8 }).map((_, i) => {
                  // eslint-disable-next-line react/no-array-index-key
                  return <SkeletonCard key={i} />;
                })}
              </div>
            )}

            <div ref={sentinelRef} className="h-1" />

            {!hasMore && results.length > 0 && (
              <p className="text-center py-10 text-white/30 text-sm">
                You&apos;ve seen it all.
              </p>
            )}
          </>
        )}
      </div>

      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-[#ff5a1f] text-white flex items-center justify-center shadow-lg hover:bg-[#ff5a1f]/80 transition-colors"
          aria-label="Back to top"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            width="20"
            height="20"
          >
            <path d="M18 15l-6-6-6 6" />
          </svg>
        </button>
      )}
    </SubPageLayout>
  );
}
