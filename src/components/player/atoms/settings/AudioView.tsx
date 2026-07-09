import { iso6393To1 } from "iso-639-3";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { FlagIcon } from "@/components/FlagIcon";
import { Menu } from "@/components/player/internals/ContextMenu";
import { useOverlayRouter } from "@/hooks/useOverlayRouter";
import { AudioTrack, playerStatus } from "@/stores/player/slices/source";
import { usePlayerStore } from "@/stores/player/store";
import { getPrettyLanguageNameFromLocale } from "@/utils/language";
import { LanguageVariant, resolveLanguageVariantUrl } from "@/stores/player/utils/languageVariants";

import { SelectableLink } from "../../internals/ContextMenu/Links";

export function AudioOption(props: {
  langCode?: string;
  children: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
  loading?: boolean;
}) {
  return (
    <SelectableLink selected={props.selected} loading={props.loading} onClick={props.onClick}>
      <span className="flex items-center">
        <span data-code={props.langCode} className="mr-3 inline-flex">
          <FlagIcon langCode={props.langCode} />
        </span>
        <span>{props.children}</span>
      </span>
    </SelectableLink>
  );
}

export function AudioView({ id }: { id: string }) {
  const { t } = useTranslation();
  const unknownChoice = t("player.menus.subtitles.unknownLanguage");

  const router = useOverlayRouter(id);
  const audioTracks = usePlayerStore((s) => s.audioTracks);
  const currentAudioTrack = usePlayerStore((s) => s.currentAudioTrack);
  const changeAudioTrack = usePlayerStore((s) => s.display?.changeAudioTrack);

  const languageVariants = usePlayerStore((s) => s.languageVariants);
  const selectedLanguageVariant = usePlayerStore((s) => s.selectedLanguageVariant);
  const selectLanguageVariant = usePlayerStore((s) => s.selectLanguageVariant);
  const display = usePlayerStore((s) => s.display);
  const redisplaySource = usePlayerStore((s) => s.redisplaySource);

  const [loadingId, setLoadingId] = useState<string | null>(null);

  const changeTrack = useCallback(
    (track: AudioTrack) => {
      selectLanguageVariant(null);
      changeAudioTrack?.(track);
      router.close();
    },
    [router, changeAudioTrack, selectLanguageVariant],
  );

  const changeVariant = useCallback(
    async (variant: LanguageVariant | null) => {
      const lid = variant?.id ?? "__original__";
      setLoadingId(lid);
      try {
        selectLanguageVariant(variant);
        if (!variant) {
          const store = usePlayerStore.getState();
          redisplaySource(store.progress.time);
        } else {
          const url = await resolveLanguageVariantUrl(
            variant.id,
            variant.type,
            variant.season,
            variant.episode,
          );
          if (!url) return;
          const isHls = url.includes(".m3u8");
          const nextSource = isHls
            ? { type: "hls" as const, url }
            : { type: "mp4" as const, qualities: { "1080": { type: "mp4" as const, url } } };

          usePlayerStore.setState((s) => {
            s.status = playerStatus.PLAYING;
            s.source = nextSource;
            s.interface.error = undefined;
          });

          display?.load({
            source: { type: isHls ? "hls" : "mp4", url },
            startAt: usePlayerStore.getState().progress.time || 0,
            automaticQuality: false,
            preferredQuality: null,
          });
        }
        router.close();
      } finally {
        setLoadingId(null);
      }
    },
    [display, selectLanguageVariant, redisplaySource, router],
  );

  return (
    <>
      <Menu.BackLink onClick={() => router.navigate("/")}>Audio</Menu.BackLink>
      <Menu.Section className="flex flex-col pb-4">
        {/* Render HLS Multiplexed Audio Tracks */}
        {audioTracks.length > 0 && languageVariants.length === 0 && audioTracks.map((v) => (
          <AudioOption
            key={v.id}
            selected={v.id === currentAudioTrack?.id && !selectedLanguageVariant}
            langCode={
              v.language.length === 3
                ? (iso6393To1[v.language] ?? v.language)
                : v.language
            }
            onClick={audioTracks.includes(v) ? () => changeTrack(v) : undefined}
          >
            {getPrettyLanguageNameFromLocale(v.language) ??
              v.label ??
              unknownChoice}
          </AudioOption>
        ))}

        {/* Render Dubs / External Language Variants */}
        {languageVariants.length > 0 && (
          <>
            <AudioOption
              selected={!selectedLanguageVariant}
              loading={loadingId === "__original__"}
              onClick={() => changeVariant(null)}
              langCode="en"
            >
              Original (English)
            </AudioOption>
            {languageVariants.map((v) => (
              <AudioOption
                key={v.id}
                selected={v.id === selectedLanguageVariant?.id}
                loading={loadingId === v.id}
                onClick={() => changeVariant(v)}
                langCode={v.language.toLowerCase().startsWith("hin") ? "hi" : "und"}
              >
                {v.label}
              </AudioOption>
            ))}
          </>
        )}
      </Menu.Section>
    </>
  );
}
