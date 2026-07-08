/* eslint-disable no-console */
import {
  FullScraperEvents,
  RunOutput,
  ScrapeMedia,
} from "@movie-web/providers";
import { RefObject, useCallback, useEffect, useRef, useState } from "react";

import { isExtensionActiveCached } from "@/backend/extension/messaging";
import { prepareStream } from "@/backend/extension/streams";
import {
  connectServerSideEvents,
  getCachedMetadata,
  makeProviderUrl,
} from "@/backend/helpers/providerApi";
import { getLoadbalancedProviderApiUrl } from "@/backend/providers/fetchers";
import { getProviders } from "@/backend/providers/providers";
import { usePreferencesStore } from "@/stores/preferences";

export interface ScrapingItems {
  id: string;
  children: string[];
}

export interface ScrapingSegment {
  name: string;
  id: string;
  embedId?: string;
  status: "failure" | "pending" | "notfound" | "success" | "waiting";
  reason?: string;
  error?: any;
  percentage: number;
}

type ScraperEvent<Event extends keyof FullScraperEvents> = Parameters<
  NonNullable<FullScraperEvents[Event]>
>[0];

function useBaseScrape() {
  const [sources, setSources] = useState<Record<string, ScrapingSegment>>({});
  const [sourceOrder, setSourceOrder] = useState<ScrapingItems[]>([]);
  const [currentSource, setCurrentSource] = useState<string>();
  const lastId = useRef<string | null>(null);

  const initEvent = useCallback((evt: ScraperEvent<"init">) => {
    const clientSources = getProviders().listSources();
    const created = evt.sourceIds.map((v) => {
      const clientSource = clientSources.find((s) => s && s.id === v);
      const serverMetadata = getCachedMetadata();
      const serverSource = serverMetadata.find((s: any) => {
        if (!s) return false;
        const item = Array.isArray(s) ? s[0] : s;
        return item && item.id === v;
      });
      const unpackedServerSource = Array.isArray(serverSource) ? serverSource[0] : serverSource;
      const name = clientSource?.name ?? unpackedServerSource?.name ?? v;
      return { id: v, name, status: "waiting" as const, percentage: 0 };
    });
    console.log("[DEBUG] initEvent sourceIds:", evt.sourceIds, "created:", created);
    setSources(created.reduce<Record<string, ScrapingSegment>>((a, v) => {
      a[v.id] = v;
      return a;
    }, {}));
    setSourceOrder(evt.sourceIds.map((v) => ({ id: v, children: [] })));
  }, []);

  const startEvent = useCallback((id: ScraperEvent<"start">) => {
    const lastIdTmp = lastId.current;
    console.log("[DEBUG] startEvent id:", id, "lastId:", lastIdTmp);
    setSources((s) => {
      if (s[id]) { s[id].status = "pending"; console.log("[DEBUG] startEvent set", id, "to pending"); }
      if (lastIdTmp && s[lastIdTmp] && s[lastIdTmp].status === "pending") {
        s[lastIdTmp].status = "success";
        console.log("[DEBUG] startEvent auto-completed", lastIdTmp, "to success");
      }
      return { ...s };
    });
    setCurrentSource(id);
    lastId.current = id;
  }, []);

  const updateEvent = useCallback((evt: ScraperEvent<"update">) => {
    console.log("[DEBUG] updateEvent:", JSON.stringify(evt));
    setSources((s) => {
      if (s[evt.id]) {
        const old = { status: s[evt.id].status, pct: s[evt.id].percentage };
        s[evt.id].status = evt.status;
        s[evt.id].reason = evt.reason;
        s[evt.id].error = evt.error;
        s[evt.id].percentage = evt.percentage;
        console.log("[DEBUG] updateEvent applied:", evt.id, "old:", old, "new:", { status: evt.status, pct: evt.percentage });
      } else {
        console.log("[DEBUG] updateEvent source not found:", evt.id);
      }
      return { ...s };
    });
  }, []);

  const discoverEmbedsEvent = useCallback(
    (evt: ScraperEvent<"discoverEmbeds">) => {
      const clientEmbeds = getProviders().listEmbeds();
      setSources((s) => {
        evt.embeds.forEach((v) => {
          const clientSource = clientEmbeds.find(
            (src) => src && src.id === v.embedScraperId,
          );
          const serverMetadata = getCachedMetadata();
          const serverSource = serverMetadata.find((src: any) => {
            if (!src) return false;
            const item = Array.isArray(src) ? src[0] : src;
            return item && item.id === v.embedScraperId;
          });
          const unpackedServerSource = Array.isArray(serverSource) ? serverSource[0] : serverSource;
          const name =
            clientSource?.name ?? unpackedServerSource?.name ?? v.embedScraperId;
          const out: ScrapingSegment = {
            embedId: v.embedScraperId,
            name,
            id: v.id,
            status: "waiting",
            percentage: 0,
          };
          s[v.id] = out;
        });
        return { ...s };
      });
      setSourceOrder((s) => {
        const source = s.find((v) => v.id === evt.sourceId);
        if (!source) return s;
        source.children = evt.embeds.map((v) => v.id);
        return [...s];
      });
    },
    [],
  );

  const startScrape = useCallback(() => {
    lastId.current = null;
  }, []);

  const getResult = useCallback((output: RunOutput | null) => {
    console.log("[DEBUG] getResult called. output:", !!output, "lastId.current:", lastId.current);
    if (output && lastId.current) {
      setSources((s) => {
        if (!lastId.current) return s;
        if (s[lastId.current]) {
          console.log("[DEBUG] getResult setting", lastId.current, "to success. current status:", s[lastId.current].status);
          s[lastId.current].status = "success";
        }
        return { ...s };
      });
    } else {
      console.log("[DEBUG] getResult skipped update. reason:", !output ? "no output" : "no lastId");
    }
    return output;
  }, []);
  return {
    initEvent,
    startEvent,
    updateEvent,
    discoverEmbedsEvent,
    startScrape,
    getResult,
    sources,
    sourceOrder,
    currentSource,
  };
}

async function validateStream(stream: any, proxyUrl?: string): Promise<boolean> {
  let url = "";
  if (stream.type === "hls") {
    url = stream.playlist;
  } else if (stream.type === "file" && stream.qualities) {
    const firstQuality = Object.values(stream.qualities)[0] as any;
    url = firstQuality?.url || "";
  }

  if (!url) return false;

  try {
    let fetchUrl = url;
    if (proxyUrl) {
      fetchUrl = `${proxyUrl}?destination=${encodeURIComponent(url)}`;
    }

    const headers: Record<string, string> = {};
    if (stream.type !== "hls") {
      headers["Range"] = "bytes=0-1024";
    }

    const response = await fetch(fetchUrl, {
      method: "GET",
      headers,
    });

    return response.ok;
  } catch (err) {
    console.warn("[useProviderScrape] Stream validation failed for URL:", url, err);
    return false;
  }
}

export function useScrape() {
  const {
    sources,
    sourceOrder,
    currentSource,
    updateEvent,
    discoverEmbedsEvent,
    initEvent,
    getResult,
    startEvent,
    startScrape,
  } = useBaseScrape();

  const preferredSourceOrder = usePreferencesStore((s) => s.sourceOrder);
  const enableSourceOrder = usePreferencesStore((s) => s.enableSourceOrder);

  const startScraping = useCallback(
    async (media: ScrapeMedia) => {
      const providerApiUrl = getLoadbalancedProviderApiUrl();
      console.log("[useProviderScrape] Starting scraping for media:", media);
      console.log("[useProviderScrape] providerApiUrl:", providerApiUrl);
      console.log(
        "[useProviderScrape] Cached metadata size:",
        getCachedMetadata().length,
      );

      startScrape();
      let clientProviderIds: string[] = [];
      let serverProviderIds: string[] = [];

      try {
        const providers = getProviders();
        const rawClientProviderIds = providers.listSources().map((s) => s.id);
        const serverMetadata = getCachedMetadata();
        const targetType = media.type === "show" ? "tv" : "movie";

        console.log("[useProviderScrape] rawClientProviderIds:", rawClientProviderIds);
        console.log("[useProviderScrape] serverMetadata:", serverMetadata);

        // Filter metadata by media type compatibility safely, unpacking arrays if needed
        const compatibleMetadata = serverMetadata.filter((s: any) => {
          if (!s) return false;
          const item = Array.isArray(s) ? s[0] : s;
          if (!item) return false;
          return !item.mediaTypes || item.mediaTypes.includes(targetType);
        }).map((s: any) => (Array.isArray(s) ? s[0] : s));

        console.log("[useProviderScrape] compatibleMetadata:", compatibleMetadata);

        // Filter and sort client-side providers using the dashboard configuration
        clientProviderIds = rawClientProviderIds
          .filter((id) => compatibleMetadata.some((s) => s && s.id === id))
          .sort((a, b) => {
            const rankA = compatibleMetadata.find((s) => s && s.id === a)?.rank ?? 999;
            const rankB = compatibleMetadata.find((s) => s && s.id === b)?.rank ?? 999;
            return rankA - rankB;
          });

        // Server-side providers are those that aren't already handled client-side
        serverProviderIds = compatibleMetadata
          .filter((s) => s && !rawClientProviderIds.includes(s.id))
          .map((s) => s.id);

        console.log("[useProviderScrape] clientProviderIds:", clientProviderIds);
        console.log("[useProviderScrape] serverProviderIds:", serverProviderIds);
      } catch (err) {
        console.error("[useProviderScrape] Failed to parse provider lists:", err);
      }

      const allSourceIds = [...clientProviderIds, ...serverProviderIds];

      initEvent({ sourceIds: allSourceIds });

      // Run client-side scrapers if any are enabled
      if (clientProviderIds.length > 0) {
        console.log("[useProviderScrape] Running client-side scrapers:", clientProviderIds);
        console.log("[DEBUG] clientProviderIds:", clientProviderIds);
        try {
          const clientOutput = await providers.runAll({
            media,
            sourceOrder: clientProviderIds,
            events: {
              init: () => {}, // Skip initEvent because we already initialized the UI list
              start: startEvent,
              update: updateEvent,
              discoverEmbeds: discoverEmbedsEvent,
            },
          });

          if (clientOutput) {
            console.log("[useProviderScrape] Client-side scrapers succeeded:", clientOutput);
            if (isExtensionActiveCached()) {
              await prepareStream(clientOutput.stream);
            }
            return getResult(clientOutput);
          }
        } catch (err) {
          console.error("[useProviderScrape] Client-side scraping error:", err);
        }
      }

      // Fallback to Server-Side SSE API
      if (providerApiUrl && serverProviderIds.length > 0) {
        console.log("[useProviderScrape] Scraping via Server-Side SSE API...");
        console.log("[DEBUG] providerApiUrl:", providerApiUrl, "serverProviderIds:", serverProviderIds);
        try {
          const baseUrlMaker = makeProviderUrl(providerApiUrl);
          const scrapeUrl = baseUrlMaker.scrapeAll(media);
          console.log("[DEBUG] SSE URL:", scrapeUrl);

          const conn = await connectServerSideEvents<RunOutput | "">(scrapeUrl, [
            "completed",
            "noOutput",
          ]);

          console.log("[DEBUG] SSE connection established, registering listeners");

          conn.on("start", (id) => {
            console.log("[DEBUG] SSE 'start' event received:", id);
            startEvent(id);
          });
          conn.on("update", (evt) => {
            console.log("[DEBUG] SSE 'update' event received:", JSON.stringify(evt));
            updateEvent(evt);
          });
          conn.on("discoverEmbeds", (evt) => {
            console.log("[DEBUG] SSE 'discoverEmbeds' event received:", evt);
            discoverEmbedsEvent(evt);
          });

          console.log("[DEBUG] All SSE listeners registered, awaiting promise...");
          const sseOutput = await conn.promise();
          console.log("[DEBUG] SSE promise resolved. Output:", sseOutput);
          console.log("[DEBUG] SSE output type:", typeof sseOutput, "empty?:", sseOutput === "", "truthy:", !!sseOutput);

          if (sseOutput && sseOutput !== "") {
            console.log("[DEBUG] SSE got stream output, stream keys:", Object.keys(sseOutput));
            if (isExtensionActiveCached()) {
              await prepareStream(sseOutput.stream);
            }
            return getResult(sseOutput);
          } else {
            console.log("[DEBUG] SSE no valid output, calling getResult(null) from SSE path");
          }
        } catch (err) {
          console.error("[DEBUG] SSE scraping error:", err);
        }
      }

      return getResult(null);
    },
    [
      initEvent,
      startEvent,
      updateEvent,
      discoverEmbedsEvent,
      getResult,
      startScrape,
      preferredSourceOrder,
      enableSourceOrder,
    ],
  );

  return {
    startScraping,
    sourceOrder,
    sources,
    currentSource,
  };
}

export function useListCenter(
  containerRef: RefObject<HTMLDivElement | null>,
  listRef: RefObject<HTMLDivElement | null>,
  sourceOrder: ScrapingItems[],
  currentSource: string | undefined,
) {
  const [renderedOnce, setRenderedOnce] = useState(false);

  const updatePosition = useCallback(() => {
    if (!containerRef.current) return;
    if (!listRef.current) return;

    const elements = [
      ...listRef.current.querySelectorAll("div[data-source-id]"),
    ] as HTMLDivElement[];

    let currentIndex = elements.findIndex(
      (e) => e.getAttribute("data-source-id") === currentSource,
    );
    if (currentIndex === -1) currentIndex = 0;

    const currentElement = elements[currentIndex];

    if (!currentElement) return;

    const containerWidth = containerRef.current.getBoundingClientRect().width;
    const listWidth = listRef.current.getBoundingClientRect().width;

    const containerHeight = containerRef.current.getBoundingClientRect().height;

    const listTop = listRef.current.getBoundingClientRect().top;

    const currentTop = currentElement.getBoundingClientRect().top;
    const currentHeight = currentElement.getBoundingClientRect().height;

    const topDifference = currentTop - listTop;

    const listNewLeft = containerWidth / 2 - listWidth / 2;
    const listNewTop = (containerHeight - 130) / 2 - topDifference - currentHeight / 2;

    listRef.current.style.transform = `translateY(${listNewTop}px) translateX(${listNewLeft}px)`;
    setTimeout(() => {
      setRenderedOnce(true);
    }, 150);
  }, [currentSource, containerRef, listRef, setRenderedOnce]);

  const updatePositionRef = useRef(updatePosition);

  useEffect(() => {
    updatePosition();
    updatePositionRef.current = updatePosition;
  }, [updatePosition, sourceOrder]);

  useEffect(() => {
    function resize() {
      updatePositionRef.current();
    }
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
    };
  }, []);

  return renderedOnce;
}
