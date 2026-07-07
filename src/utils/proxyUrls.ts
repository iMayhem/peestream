/* eslint-disable no-console */
import { setM3U8ProxyUrl } from "@movie-web/providers";

import { conf } from "@/setup/config";
import { useAuthStore } from "@/stores/auth";

const originalUrls = conf().PROXY_URLS;
const types = ["proxy", "api"] as const;

type ParsedUrlType = (typeof types)[number];

export interface ParsedUrl {
  url: string;
  type: ParsedUrlType;
}

function canParseUrl(url: string): boolean {
  try {
    return !!new URL(url);
  } catch {
    return false;
  }
}

function isParsedUrlType(type: string): type is ParsedUrlType {
  return types.includes(type as any);
}

/**
 * Turn a string like "a=b;c=d;d=e" into a dictionary object
 */
function parseParams(input: string): Record<string, string> {
  const entriesParams = input
    .split(";")
    .map((param) => param.split("=", 2).filter((part) => part.length !== 0))
    .filter((v) => v.length === 2);
  return Object.fromEntries(entriesParams);
}

function parseUrls(list: string[]): ParsedUrl[] {
  const output: ParsedUrl[] = [];
  list.forEach((url) => {
    if (!url.startsWith("|")) {
      if (canParseUrl(url)) {
        output.push({
          url,
          type: "proxy",
        });
        return;
      }
    }

    const match = /^\|([^|]+)\|(.*)$/g.exec(url);
    if (!match || !match[2]) return;
    if (!canParseUrl(match[2])) return;
    const params = parseParams(match[1]);
    const type = params.type ?? "proxy";

    if (!isParsedUrlType(type)) return;
    output.push({
      url: match[2],
      type,
    });
  });
  return output;
}

export function getParsedUrls() {
  const userSet = useAuthStore.getState().proxySet;
  const urls = userSet ?? originalUrls;
  let output = parseUrls(urls);
  console.log("[ProxyURLs] userSet:", userSet);
  console.log("[ProxyURLs] originalUrls:", originalUrls);
  console.log("[ProxyURLs] initial parsed output:", output);

  // If user-set proxy URLs are all HTTP (would cause mixed-content errors),
  // fall back to the config-provided URLs instead
  if (
    userSet !== null &&
    output.length > 0 &&
    output.every((u) => !u.url.startsWith("https://"))
  ) {
    output = parseUrls(originalUrls);
    console.log("[ProxyURLs] HTTP fallback applied, new output:", output);
  }

  const runtimeConfigUrl =
    (window as any)?.__CONFIG__?.VITE_CORS_PROXY_URL || "";
  const runtimeUrls = runtimeConfigUrl
    .split(",")
    .map((v: any) => v.trim())
    .filter((v: any) => v.length > 0);
  const defaultParsed = parseUrls(runtimeUrls);
  const defaultApiUrls = defaultParsed.filter((u) => u.type === "api");
  if (defaultApiUrls.length > 0 && !output.some((u) => u.type === "api")) {
    output = [...output, ...defaultApiUrls];
    console.log("[ProxyURLs] Appended default API URLs, final output:", output);
  }

  return output;
}

export function getProxyUrls() {
  const urls = getParsedUrls()
    .filter((v) => v.type === "proxy")
    .map((v) => v.url);
  if (urls.length > 0) {
    try {
      setM3U8ProxyUrl(urls[0]);
    } catch {
      // ignore
    }
  }
  return urls;
}

export function getProviderApiUrls() {
  return getParsedUrls()
    .filter((v) => v.type === "api")
    .map((v) => v.url);
}
