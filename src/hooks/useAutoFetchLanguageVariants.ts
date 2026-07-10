import { useEffect, useRef } from "react";

import { playerStatus } from "@/stores/player/slices/source";
import { usePlayerStore } from "@/stores/player/store";
import { fetchLanguageVariants } from "@/stores/player/utils/languageVariants";

export function useAutoFetchLanguageVariants() {
  const meta = usePlayerStore((s) => s.meta);
  const status = usePlayerStore((s) => s.status);
  const setLanguageVariants = usePlayerStore((s) => s.setLanguageVariants);
  const fetchedKeyRef = useRef<string | null>(null);
  const activeKeyRef = useRef<string | null>(null);

  useEffect(() => {
    // A player reset clears the variants. Clear the memoized key too, so
    // replaying the same title/episode fetches them again instead of leaving
    // the Audio menu empty.
    if (!meta) {
      fetchedKeyRef.current = null;
      activeKeyRef.current = null;
      return;
    }
    // Fire as soon as we have meta — parallel to main scraping, not after
    if (status === playerStatus.IDLE) return;
    const key = `${meta.tmdbId}-${meta.type === "show" ? meta.episode?.tmdbId ?? "" : ""}`;
    if (fetchedKeyRef.current === key) return;
    fetchedKeyRef.current = key;
    activeKeyRef.current = key;

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
      if (activeKeyRef.current !== key) return;
      const allVariants = results.flat();
      if (allVariants.length > 0) {
        const counts = new Map<string, number>();
        for (const v of allVariants) {
          const languageKey = `${v.language.toLowerCase()}:${v.episode ?? ""}`;
          counts.set(languageKey, (counts.get(languageKey) ?? 0) + 1);
        }

        const unique = [];
        const seen = new Set();
        for (const v of allVariants) {
          // Keep alternatives from different providers. The previous language-only
          // dedupe made Athena hide a usable Russian or Spanish fallback.
          const ukey = v.id;
          if (!seen.has(ukey)) {
            seen.add(ukey);
            const languageKey = `${v.language.toLowerCase()}:${v.episode ?? ""}`;
            unique.push({
              ...v,
              label: (counts.get(languageKey) ?? 0) > 1
                ? `${v.label} · ${v.provider}`
                : v.label,
            });
          }
        }
        setLanguageVariants(unique);
      }
    });
  }, [meta?.tmdbId, meta?.episode?.tmdbId, status, meta?.title, meta?.releaseYear, meta?.type, setLanguageVariants]);
}
