import { useCallback, useState } from "react";

import { Menu } from "@/components/player/internals/ContextMenu";
import { SelectableLink } from "@/components/player/internals/ContextMenu/Links";
import { useOverlayRouter } from "@/hooks/useOverlayRouter";
import { usePlayerStore } from "@/stores/player/store";
import {
  LanguageVariant,
  resolveLanguageVariantUrl,
} from "@/stores/player/utils/languageVariants";

let latestRequestId = "";

export function LanguageView({ id }: { id: string }) {
  const router = useOverlayRouter(id);
  const variants = usePlayerStore((s) => s.languageVariants);
  const selectedVariant = usePlayerStore((s) => s.selectedLanguageVariant);
  const display = usePlayerStore((s) => s.display);
  const selectLanguageVariant = usePlayerStore((s) => s.selectLanguageVariant);
  const redisplaySource = usePlayerStore((s) => s.redisplaySource);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const change = useCallback(
    async (variant: LanguageVariant | null) => {
      const lid = variant?.id ?? "__original__";
      latestRequestId = lid;

      // Immediately stop/clear the player display to prevent audio/video overlap
      display?.load({
        source: null,
        startAt: 0,
        automaticQuality: false,
        preferredQuality: null,
      });

      setLoadingId(lid);
      try {
        selectLanguageVariant(variant);
        if (!variant) {
          const store = usePlayerStore.getState();
          redisplaySource(store.progress.time);
        } else {
          const resolved = await resolveLanguageVariantUrl(
            variant.id,
            variant.type,
            variant.season,
            variant.episode,
          );
          if (latestRequestId !== lid) return;
          if (!resolved) {
            selectLanguageVariant(null);
            redisplaySource(usePlayerStore.getState().progress.time);
            return;
          }
          display?.load({
            source: {
              type: resolved.type === "hls" ? "hls" : "mp4",
              url: resolved.url,
            },
            startAt: usePlayerStore.getState().progress.time || 0,
            automaticQuality: false,
            preferredQuality: null,
          });
        }
        router.close();
      } finally {
        if (latestRequestId === lid) {
          setLoadingId(null);
        }
      }
    },
    [display, selectLanguageVariant, redisplaySource, router],
  );

  return (
    <>
      <Menu.BackLink onClick={() => router.navigate("/")}>Dubs</Menu.BackLink>
      <Menu.Section className="flex flex-col pb-4">
        <SelectableLink
          selected={!selectedVariant}
          loading={loadingId === "__original__"}
          onClick={() => change(null)}
        >
          Original
        </SelectableLink>
        {variants.map((v) => (
          <SelectableLink
            key={v.id}
            selected={v.id === selectedVariant?.id}
            loading={loadingId === v.id}
            onClick={() => change(v)}
          >
            {v.label}
          </SelectableLink>
        ))}
      </Menu.Section>
    </>
  );
}
