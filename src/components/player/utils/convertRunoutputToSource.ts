import { Stream } from "@movie-web/providers";

import {
  SourceFileStream,
  SourceQuality,
  SourceSliceSource,
} from "@/stores/player/utils/qualities";

const allowedQualitiesMap: Record<SourceQuality, SourceQuality> = {
  "4k": "4k",
  "1080": "1080",
  "480": "480",
  "360": "360",
  "720": "720",
  unknown: "unknown",
};
const allowedQualities = Object.keys(allowedQualitiesMap);
const allowedFileTypes = ["mp4"];

function isAllowedQuality(inp: string): inp is SourceQuality {
  return allowedQualities.includes(inp);
}

function normalizeQuality(q: string): SourceQuality {
  const clean = q.toLowerCase().replace("p", "");
  if (clean === "2160" || clean === "4k") return "4k";
  if (clean === "1080") return "1080";
  if (clean === "720") return "720";
  if (clean === "480") return "480";
  if (clean === "360") return "360";
  return "unknown";
}

export function convertRunoutputToSource(out: {
  stream: Stream;
}): SourceSliceSource {
  if (out.stream.type === "hls") {
    return {
      type: "hls",
      url: out.stream.playlist,
      headers: out.stream.headers,
      preferredHeaders: out.stream.preferredHeaders,
    };
  }
  if (out.stream.type === "file") {
    const qualities: Partial<Record<SourceQuality, SourceFileStream>> = {};
    Object.entries(out.stream.qualities).forEach((entry) => {
      const normalizedQuality = normalizeQuality(entry[0]);
      if (!isAllowedQuality(normalizedQuality)) {
        console.warn(`unrecognized quality: ${entry[0]}`);
        return;
      }
      if (!allowedFileTypes.includes(entry[1].type)) {
        console.warn(`unrecognized file type: ${entry[1].type}`);
        return;
      }
      qualities[normalizedQuality] = {
        type: entry[1].type,
        url: entry[1].url,
      };
    });
    return {
      type: "file",
      qualities,
      headers: out.stream.headers,
      preferredHeaders: out.stream.preferredHeaders,
    };
  }
  throw new Error("unrecognized type");
}
