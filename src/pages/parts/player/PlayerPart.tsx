import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { BrandPill } from "@/components/layout/BrandPill";
import { Icon, Icons } from "@/components/Icon";
import { Player } from "@/components/player";
import { useShouldShowControls } from "@/components/player/hooks/useShouldShowControls";
import { useIsMobile } from "@/hooks/useIsMobile";
import { PlayerMeta, playerStatus } from "@/stores/player/slices/source";
import { usePlayerStore } from "@/stores/player/store";

import { ScrapingPartInterruptButton } from "./ScrapingPart";

export interface PlayerPartProps {
  children?: ReactNode;
  backUrl: string;
  onLoad?: () => void;
  onMetaChange?: (meta: PlayerMeta) => void;
}

export function PlayerPart(props: PlayerPartProps) {
  const navigate = useNavigate();
  const source = usePlayerStore((s) => s.source);
  const { showTargets, showTouchTargets } = useShouldShowControls();
  const status = usePlayerStore((s) => s.status);
  const { isMobile } = useIsMobile();
  const isLoading = usePlayerStore((s) => s.mediaPlaying.isLoading);
  const languageVariants = usePlayerStore((s) => s.languageVariants);

  // Show settings when playing OR when scrape failed but audio variants are available
  const showSettings =
    status === playerStatus.PLAYING ||
    status === playerStatus.PLAYBACK_ERROR ||
    (status === playerStatus.SCRAPE_NOT_FOUND && languageVariants.length > 0);

  return (
    <Player.Container onLoad={props.onLoad} showingControls={showTargets}>
      {props.children}
      <Player.BlackOverlay
        show={showTargets && status === playerStatus.PLAYING}
      />
      <Player.EpisodesRouter onChange={props.onMetaChange} />
      <Player.SettingsRouter />
      <Player.SubtitleView controlsShown={showTargets} />

      {status === playerStatus.PLAYING ? (
        <>
          <Player.CenterControls>
            <Player.LoadingSpinner />
            <Player.AutoPlayStart />
          </Player.CenterControls>
          <Player.CenterControls>
            <Player.CastingNotification />
          </Player.CenterControls>
        </>
      ) : null}

      <Player.CenterMobileControls
        className="text-white"
        show={showTouchTargets && status === playerStatus.PLAYING}
      >
        <Player.SkipBackward iconSizeClass="text-3xl" />
        <Player.Pause
          iconSizeClass="text-5xl"
          className={isLoading ? "opacity-0" : "opacity-100"}
        />
        <Player.SkipForward iconSizeClass="text-3xl" />
      </Player.CenterMobileControls>

      <Player.TopControls show={showTargets}>
        <div className="grid grid-cols-[1fr,auto] xl:grid-cols-3 items-center">
          <div className="flex space-x-3 items-center">
            <Player.BackLink url={props.backUrl} />
            <span className="text mx-3 text-type-secondary">/</span>
            <Player.Title />
            <Player.BookmarkButton />
          </div>
          <div className="text-center hidden xl:flex justify-center items-center">
            <Player.EpisodeTitle />
          </div>
          <div className="hidden sm:flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                let videoUrl = "";
                if (source?.type === "hls") {
                  videoUrl = (source as any).playlist || "";
                } else if (source?.type === "file") {
                  const quals = Object.values((source as any).qualities || {}) as any[];
                  videoUrl = quals.find((q: any) => q?.url)?.url || "";
                }
                const params = videoUrl ? `?url=${encodeURIComponent(videoUrl)}` : "";
                navigate(`/watch-together${params}`);
              }}
              className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-white bg-pill-background bg-opacity-50 hover:bg-pill-backgroundHover backdrop-blur-lg transition-[transform,background-color] hover:scale-105 active:scale-95"
            >
              <Icon className="text-lg" icon={Icons.WATCH_PARTY} />
              <span className="hidden lg:inline font-medium">Watch Together</span>
            </button>
            <BrandPill />
          </div>
          <div className="flex sm:hidden items-center justify-end">
            {status === playerStatus.PLAYING ? (
              <>
                <Player.Airplay />
                <Player.Chromecast />
              </>
            ) : null}
          </div>
        </div>
      </Player.TopControls>

      <Player.BottomControls show={showTargets}>
        <div className="flex items-center justify-center space-x-3 h-full">
          {status === playerStatus.SCRAPING ? (
            <ScrapingPartInterruptButton />
          ) : null}
          {status === playerStatus.PLAYING ? (
            <>
              {isMobile ? <Player.Time short /> : null}
              <Player.ProgressBar />
            </>
          ) : null}
        </div>
        <div className="hidden lg:flex justify-between" dir="ltr">
          <Player.LeftSideControls>
            {status === playerStatus.PLAYING ? (
              <>
                <Player.Pause />
                <Player.SkipBackward />
                <Player.SkipForward />
                <Player.Volume />
                <Player.Time />
              </>
            ) : null}
          </Player.LeftSideControls>
          <div className="flex items-center space-x-3">
            <Player.Episodes />
            {status === playerStatus.PLAYING ? (
              <>
                <Player.Pip />
                <Player.Airplay />
                <Player.Chromecast />
              </>
            ) : null}
            {status === playerStatus.PLAYBACK_ERROR ||
            status === playerStatus.PLAYING ? (
              <>
                <Player.Captions />
                <Player.Settings />
              </>
            ) : showSettings ? (
              <Player.Settings />
            ) : null}
            <Player.Fullscreen />
          </div>
        </div>
        <div className="grid grid-cols-[2.5rem,1fr,2.5rem] gap-3 lg:hidden">
          <div />
          <div className="flex justify-center space-x-3">
            {status === playerStatus.PLAYING ? <Player.Pip /> : null}
            <Player.Episodes />
            {status === playerStatus.PLAYING ? <Player.Settings /> : showSettings ? <Player.Settings /> : null}
          </div>
          <div>
            <Player.Fullscreen />
          </div>
        </div>
      </Player.BottomControls>

      <Player.VolumeChangedPopout />

      <Player.NextEpisodeButton
        controlsShowing={showTargets}
        onChange={props.onMetaChange}
      />
    </Player.Container>
  );
}
