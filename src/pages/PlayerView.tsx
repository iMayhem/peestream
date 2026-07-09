import { RunOutput } from "@movie-web/providers";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { useAsync } from "react-use";

import { usePlayer } from "@/components/player/hooks/usePlayer";
import { usePlayerMeta } from "@/components/player/hooks/usePlayerMeta";
import { convertProviderCaption } from "@/components/player/utils/captions";
import { convertRunoutputToSource } from "@/components/player/utils/convertRunoutputToSource";
import { getLoadbalancedProviderApiUrl } from "@/backend/providers/fetchers";
import { useAutoFetchLanguageVariants } from "@/hooks/useAutoFetchLanguageVariants";
import { resolveLanguageVariantUrl } from "@/stores/player/utils/languageVariants";
import { ScrapingItems, ScrapingSegment } from "@/hooks/useProviderScrape";
import { useQueryParam } from "@/hooks/useQueryParams";
import { MetaPart } from "@/pages/parts/player/MetaPart";
import { PlaybackErrorPart } from "@/pages/parts/player/PlaybackErrorPart";
import { PlayerPart } from "@/pages/parts/player/PlayerPart";
import { ScrapeErrorPart } from "@/pages/parts/player/ScrapeErrorPart";
import { ScrapingPart } from "@/pages/parts/player/ScrapingPart";
import { useLastNonPlayerLink } from "@/stores/history";
import { PlayerMeta, playerStatus } from "@/stores/player/slices/source";
import { usePlayerStore } from "@/stores/player/store";
import { needsOnboarding } from "@/utils/onboarding";
import { parseTimestamp } from "@/utils/timestamp";

export function RealPlayerView() {
  const navigate = useNavigate();
  const params = useParams<{
    media: string;
    episode?: string;
    season?: string;
  }>();
  const [errorData, setErrorData] = useState<{
    sources: Record<string, ScrapingSegment>;
    sourceOrder: ScrapingItems[];
  } | null>(null);
  const [startAtParam] = useQueryParam("t");
  const {
    status,
    playMedia,
    reset,
    setScrapeNotFound,
    shouldStartFromBeginning,
    setShouldStartFromBeginning,
  } = usePlayer();
  const { setPlayerMeta, scrapeMedia } = usePlayerMeta();
  const backUrl = useLastNonPlayerLink();

  useAutoFetchLanguageVariants();

  const languageVariants = usePlayerStore((s) => s.languageVariants);
  const display = usePlayerStore((s) => s.display);
  const autoLoadedVariantRef = useRef<string | null>(null);

  // When main scrapers fail but HomeCine found Spanish streams, auto-load the first one
  useEffect(() => {
    if (status !== playerStatus.SCRAPE_NOT_FOUND) return;
    if (languageVariants.length === 0) return;
    const first = languageVariants[0];
    if (autoLoadedVariantRef.current === first.id) return;
    autoLoadedVariantRef.current = first.id;

    resolveLanguageVariantUrl(first.id, first.type, first.season, first.episode).then((url) => {
      if (!url) return;
      const isHls = url.includes(".m3u8");
      display?.load({
        source: { type: isHls ? "hls" : "mp4", url },
        startAt: 0,
        automaticQuality: false,
        preferredQuality: null,
      });
    });
  }, [status, languageVariants, display]);

  const paramsData = JSON.stringify({
    media: params.media,
    season: params.season,
    episode: params.episode,
  });
  useEffect(() => {
    reset();
  }, [paramsData, reset]);

  const metaChange = useCallback(
    (meta: PlayerMeta) => {
      if (meta?.type === "show")
        navigate(
          `/media/${params.media}/${meta.season?.tmdbId}/${meta.episode?.tmdbId}`,
        );
      else navigate(`/media/${params.media}`);
    },
    [navigate, params],
  );

  const playAfterScrape = useCallback(
    (out: RunOutput | null) => {
      if (!out) return;

      let startAt: number | undefined;
      if (startAtParam) startAt = parseTimestamp(startAtParam) ?? undefined;

      const captions = convertProviderCaption(out.stream.captions);

      playMedia(
        convertRunoutputToSource(out),
        captions,
        out.sourceId,
        shouldStartFromBeginning ? 0 : startAt,
      );
      setShouldStartFromBeginning(false);

      const meta = usePlayerStore.getState().meta;
      if (!meta) return;
      const baseUrl = getLoadbalancedProviderApiUrl();
      if (!baseUrl) return;
      fetch(
        `${baseUrl}/api/subtitles?tmdbId=${meta.tmdbId}&type=${meta.type}`,
      )
        .then((r) => r.json())
        .then((data) => {
          if (!data.captions || data.captions.length === 0) return;
          usePlayerStore.setState((s) => {
            const existingIds = new Set(s.captionList.map((c) => c.id));
            const fresh = data.captions.filter((c) => !existingIds.has(c.id));
            if (fresh.length === 0) return s;
            return { captionList: [...s.captionList, ...fresh] };
          });
        })
        .catch(() => {});
    },
    [
      playMedia,
      startAtParam,
      shouldStartFromBeginning,
      setShouldStartFromBeginning,
    ],
  );

  return (
    <PlayerPart backUrl={backUrl} onMetaChange={metaChange}>
      {status === playerStatus.IDLE ? (
        <MetaPart onGetMeta={setPlayerMeta} />
      ) : null}
      {status === playerStatus.SCRAPING && scrapeMedia ? (
        <ScrapingPart
          media={scrapeMedia}
          onResult={(sources, sourceOrder) => {
            setErrorData({
              sourceOrder,
              sources,
            });
            setScrapeNotFound();
          }}
          onGetStream={playAfterScrape}
        />
      ) : null}
      {status === playerStatus.SCRAPE_NOT_FOUND && errorData ? (
        <ScrapeErrorPart data={errorData} />
      ) : null}
      {status === playerStatus.PLAYBACK_ERROR ? <PlaybackErrorPart /> : null}
    </PlayerPart>
  );
}

export function PlayerView() {
  const loc = useLocation();
  const { loading, error, value } = useAsync(() => {
    return needsOnboarding();
  });

  if (error) throw new Error("Failed to detect onboarding");
  if (loading) return null;
  if (value)
    return (
      <Navigate
        replace
        to={{
          pathname: "/onboarding",
          search: `redirect=${encodeURIComponent(loc.pathname)}`,
        }}
      />
    );
  return <RealPlayerView />;
}

export default PlayerView;
