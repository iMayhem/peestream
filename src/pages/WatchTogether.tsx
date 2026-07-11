import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export function WatchTogetherPage() {
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      const data = event.data;
      if (!data || typeof data !== "object") return;

      if (data.type === "watchable-party-nav") {
        const next = typeof data.path === "string" ? data.path : "";
        if (!next.startsWith("/party")) return;
        if (next === window.location.pathname + window.location.search) return;
        window.history.replaceState(null, "", next);
        return;
      }

      if (data.type === "watchable-site-nav") {
        const next = typeof data.path === "string" ? data.path : "/";
        if (!next.startsWith("/") || next.startsWith("//")) return;
        navigate(next);
      }
    },
    [navigate],
  );

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100dvh",
        background: "#0b0a08",
        overflow: "hidden",
      }}
    >
      <iframe
        ref={iframeRef}
        src="/party/app.html"
        title="Watch Together"
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
        onLoad={() => setLoaded(true)}
        style={{
          flex: "1 1 auto",
          width: "100%",
          border: 0,
          height: "100dvh",
          minHeight: "100dvh",
          background: "#0b0a08",
          opacity: loaded ? 1 : 0,
          transition: "opacity 0.2s ease-out",
        }}
      />
    </div>
  );
}

export default WatchTogetherPage;
