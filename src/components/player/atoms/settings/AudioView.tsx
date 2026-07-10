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

function getLocaleForLanguageName(name: string): string {
  const normalized = name.toLowerCase().trim();
  if (normalized.includes("latino")) return "es-MX";
  if (normalized.includes("castellano") || normalized === "español" || normalized === "spanish") return "es-ES";
  if (normalized.includes("hindi")) return "hi-IN";
  if (normalized.includes("tamil")) return "ta-IN";
  if (normalized.includes("telugu")) return "te-IN";
  if (normalized.includes("malayalam")) return "ml-IN";
  if (normalized.includes("kannada")) return "kn-IN";
  if (normalized.includes("bengali")) return "bn-IN";
  if (normalized.includes("marathi")) return "mr-IN";
  if (normalized.includes("gujarati")) return "gu-IN";
  if (normalized.includes("punjabi")) return "pa-IN";
  if (normalized.includes("arabic")) return "ar-SA";
  if (normalized.includes("indonesian")) return "id-ID";
  if (normalized.includes("french")) return "fr-FR";
  if (normalized.includes("german")) return "de-DE";
  if (normalized.includes("italian")) return "it-IT";
  if (normalized.includes("portuguese")) return "pt-BR";
  if (normalized.includes("russian")) return "ru-RU";
  if (normalized.includes("japanese")) return "ja-JP";
  if (normalized.includes("korean")) return "ko-KR";
  if (normalized.includes("chinese")) return "zh-CN";
  return "und";
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
            : { type: "file" as const, qualities: { "1080": { type: "mp4" as const, url } } };

          usePlayerStore.setState((s) => ({
            status: playerStatus.PLAYING,
            source: nextSource,
            interface: {
              ...s.interface,
              error: undefined,
            },
          }));

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
                langCode={getLocaleForLanguageName(v.language)}
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
