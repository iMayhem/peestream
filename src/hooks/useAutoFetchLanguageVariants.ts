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

    setLanguageVariants([]);

    const fetchPromises = [];

    // Fetch primary variant
    fetchPromises.push(
      fetchLanguageVariants(
        meta.title,
        meta.releaseYear,
        meta.type,
        meta.tmdbId,
        meta.type === "show" ? meta.season?.number : undefined,
        meta.type === "show" ? meta.episode?.number : undefined,
      )
    );

    // Fetch adjacent episode if part of a multi-part episode
    if (meta.type === "show" && meta.episode && meta.season) {
      const epTitle = meta.episode.title;
      const epNum = meta.episode.number;
      const partMatch = epTitle.match(/(?:Part\s*|#\s*|\(\s*)(\d+)(?:\s*\))?/i);
      if (partMatch) {
        const currentPart = parseInt(partMatch[1], 10);
        let adjacentEpNum: number | null = null;
        if (currentPart === 1) {
          adjacentEpNum = epNum + 1;
        } else if (currentPart === 2) {
          adjacentEpNum = epNum - 1;
        }

        if (adjacentEpNum !== null && adjacentEpNum > 0) {
          fetchPromises.push(
            fetchLanguageVariants(
              meta.title,
              meta.releaseYear,
              meta.type,
              meta.tmdbId,
              meta.season.number,
              adjacentEpNum,
            ).then((variants) =>
              variants.map((v) => ({
                ...v,
                label: `${v.language} (Ep ${adjacentEpNum})`,
                episode: adjacentEpNum,
              }))
            )
          );
        }
      }
    }

    Promise.all(fetchPromises).then((results) => {
      const allVariants = results.flat();
      if (allVariants.length > 0) {
        const unique = [];
        const seen = new Set();
        for (const v of allVariants) {
          // Dedup by language — only show each language once (best source wins)
          const ukey = v.language.toLowerCase();
          if (!seen.has(ukey)) {
            seen.add(ukey);
            unique.push(v);
          }
        }
        setLanguageVariants(unique);
      }
    });
  }, [meta?.tmdbId, meta?.episode?.tmdbId, status, meta?.title, meta?.releaseYear, meta?.type, setLanguageVariants]);
}
