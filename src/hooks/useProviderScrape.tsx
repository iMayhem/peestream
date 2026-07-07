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
    setSources(
      evt.sourceIds
        .map((v) => {
          const clientSource = clientSources.find((s) => s.id === v);
          const serverSource = getCachedMetadata().find((s) => s.id === v);
          const name = clientSource?.name ?? serverSource?.name ?? v;
          const out: ScrapingSegment = {
            name,
            id: v,
            status: "waiting",
            percentage: 0,
          };
          return out;
        })
        .reduce<Record<string, ScrapingSegment>>((a, v) => {
          a[v.id] = v;
          return a;
        }, {}),
    );
    setSourceOrder(evt.sourceIds.map((v) => ({ id: v, children: [] })));
  }, []);

  const startEvent = useCallback((id: ScraperEvent<"start">) => {
    const lastIdTmp = lastId.current;
    setSources((s) => {
      if (s[id]) s[id].status = "pending";
      if (lastIdTmp && s[lastIdTmp] && s[lastIdTmp].status === "pending")
        s[lastIdTmp].status = "success";
      return { ...s };
    });
    setCurrentSource(id);
    lastId.current = id;
  }, []);

  const updateEvent = useCallback((evt: ScraperEvent<"update">) => {
    setSources((s) => {
      if (s[evt.id]) {
        s[evt.id].status = evt.status;
        s[evt.id].reason = evt.reason;
        s[evt.id].error = evt.error;
        s[evt.id].percentage = evt.percentage;
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
            (src) => src.id === v.embedScraperId,
          );
          const serverSource = getCachedMetadata().find(
            (src) => src.id === v.embedScraperId,
          );
          const name =
            clientSource?.name ?? serverSource?.name ?? v.embedScraperId;
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
    if (output && lastId.current) {
      setSources((s) => {
        if (!lastId.current) return s;
        if (s[lastId.current]) s[lastId.current].status = "success";
        return { ...s };
      });
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
      const providers = getProviders();
      const rawClientProviderIds = providers.listSources().map((s) => s.id);
      const serverMetadata = getCachedMetadata();

      // Filter and sort client-side providers using the dashboard configuration
      const clientProviderIds = rawClientProviderIds
        .filter((id) => serverMetadata.some((s) => s.id === id))
        .sort((a, b) => {
          const rankA = serverMetadata.find((s) => s.id === a)?.rank ?? 999;
          const rankB = serverMetadata.find((s) => s.id === b)?.rank ?? 999;
          return rankA - rankB;
        });

      // Server-side providers are those that aren't already handled client-side
      const serverProviderIds = serverMetadata
        .filter((s) => !rawClientProviderIds.includes(s.id))
        .map((s) => s.id);

      const allSourceIds = [...clientProviderIds, ...serverProviderIds];

      initEvent({ sourceIds: allSourceIds });

      console.log("[useProviderScrape] Running client-side scrapers first...");
      const clientOutput = await providers.runAll({
        media,
        sourceOrder: enableSourceOrder ? preferredSourceOrder : undefined,
        events: {
          init: () => {}, // Skip initEvent because we already initialized the UI list
          start: startEvent,
          update: updateEvent,
          discoverEmbeds: discoverEmbedsEvent,
        },
      });

      if (clientOutput) {
        console.log(
          "[useProviderScrape] Client-side scrapers succeeded:",
          clientOutput,
        );
        if (isExtensionActiveCached()) {
          await prepareStream(clientOutput.stream);
        }
        return getResult(clientOutput);
      }

      if (providerApiUrl) {
        console.log(
          "[useProviderScrape] Client-side failed. Scraping via Server-Side SSE API...",
        );
        const baseUrlMaker = makeProviderUrl(providerApiUrl);
        const scrapeUrl = baseUrlMaker.scrapeAll(media);
        console.log("[useProviderScrape] Connecting to SSE URL:", scrapeUrl);
        const conn = await connectServerSideEvents<RunOutput | "">(scrapeUrl, [
          "completed",
          "noOutput",
        ]);
        conn.on("start", (id) => {
          console.log("[useProviderScrape] SSE 'start' event:", id);
          startEvent(id);
        });
        conn.on("update", (evt) => {
          console.log("[useProviderScrape] SSE 'update' event:", evt);
          updateEvent(evt);
        });
        conn.on("discoverEmbeds", (evt) => {
          console.log("[useProviderScrape] SSE 'discoverEmbeds' event:", evt);
          discoverEmbedsEvent(evt);
        });
        const sseOutput = await conn.promise();
        console.log("[useProviderScrape] SSE completed. Output:", sseOutput);
        if (sseOutput && isExtensionActiveCached()) {
          await prepareStream(sseOutput.stream);
        }

        return getResult(sseOutput === "" ? null : sseOutput);
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

    const currentIndex = elements.findIndex(
      (e) => e.getAttribute("data-source-id") === currentSource,
    );

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
    const listNewTop = containerHeight / 2 - topDifference - currentHeight / 2;

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
