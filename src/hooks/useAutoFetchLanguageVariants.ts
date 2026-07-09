import { useEffect, useRef } from "react";

import { playerStatus } from "@/stores/player/slices/source";
import { usePlayerStore } from "@/stores/player/store";
import { fetchLanguageVariants } from "@/stores/player/utils/languageVariants";

export function useAutoFetchLanguageVariants() {
  const meta = usePlayerStore((s) => s.meta);
  const status = usePlayerStore((s) => s.status);
  const setLanguageVariants = usePlayerStore((s) => s.setLanguageVariants);
  const fetchedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!meta) return;
    // Fire as soon as we have meta — parallel to main scraping, not after
    if (status === playerStatus.IDLE) return;
    const key = `${meta.tmdbId}-${meta.type === "show" ? meta.episode?.tmdbId ?? "" : ""}`;
    if (fetchedKeyRef.current === key) return;
    fetchedKeyRef.current = key;

    fetchLanguageVariants(
      meta.title,
      meta.releaseYear,
      meta.type,
      meta.tmdbId,
      meta.type === "show" ? meta.season?.number : undefined,
      meta.type === "show" ? meta.episode?.number : undefined,
    ).then((variants) => {
      if (variants.length > 0) setLanguageVariants(variants);
    });
  }, [meta?.tmdbId, meta?.episode?.tmdbId, status, meta?.title, meta?.releaseYear, meta?.type, setLanguageVariants]);
}
