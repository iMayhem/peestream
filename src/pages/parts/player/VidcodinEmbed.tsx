import { useParams } from "react-router-dom";

import { decodeTMDBId } from "@/backend/metadata/tmdb";
import { MWMediaType } from "@/backend/metadata/types/mw";
import { usePlayerStore } from "@/stores/player/store";

export function VidcodinEmbed() {
  const params = useParams<{
    media: string;
    episode?: string;
    season?: string;
  }>();

  const meta = usePlayerStore((s) => s.meta);

  let tmdbId = meta?.tmdbId || "";
  let isTv = meta?.type === "show";
  let seasonNumber = meta?.season?.number ?? 1;
  let episodeNumber = meta?.episode?.number ?? 1;

  if (!tmdbId && params.media) {
    const decoded = decodeTMDBId(params.media);
    if (decoded) {
      tmdbId = decoded.id;
      isTv = decoded.type === MWMediaType.SERIES;
    } else {
      if (params.media.includes("tv") || params.media.includes("show")) {
        isTv = true;
      }
      const match = params.media.match(/\d+/);
      if (match) tmdbId = match[0];
    }
  }

  if (!tmdbId) return null;

  const embedUrl = isTv
    ? `https://vidcodin.net/embed/tv/${tmdbId}/${seasonNumber}/${episodeNumber}`
    : `https://vidcodin.net/embed/movie/${tmdbId}`;

  return (
    <div className="absolute inset-0 w-full h-full bg-black z-30 pointer-events-auto">
      <iframe
        key={embedUrl}
        src={embedUrl}
        title="Vidcodin Player"
        className="w-full h-full border-0 absolute inset-0 pointer-events-auto"
        allowFullScreen
        allow="autoplay; encrypted-media; picture-in-picture; accelerometer; gyroscope"
      />
    </div>
  );
}
