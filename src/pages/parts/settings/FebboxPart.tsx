import { useCallback, useEffect, useRef, useState } from "react";

import { Toggle } from "@/components/buttons/Toggle";
import { SettingsCard } from "@/components/layout/SettingsCard";
import { AuthInputBox } from "@/components/text-inputs/AuthInputBox";
import { Divider } from "@/components/utils/Divider";
import { conf } from "@/setup/config";
import { usePreferencesStore } from "@/stores/preferences";

type ValidationStatus = "unset" | "loading" | "success" | "invalid_token" | "api_down" | "error";

const AURORA_API = "https://aurora.fontaine.lol";

async function validateToken(token: string | null): Promise<ValidationStatus> {
  if (!token) return "unset";
  try {
    const res = await fetch(`${AURORA_API}/traffic?ui=${token}`);
    if (!res.ok) {
      if (res.status === 502 || res.status === 503) return "api_down";
      return "invalid_token";
    }
    const data = await res.json();
    return data?.error ? "invalid_token" : "success";
  } catch {
    return "error";
  }
}

interface FebboxQuota {
  traffic_today_usage?: string;
  traffic_limit?: string;
  reset_at?: string;
}

async function fetchQuota(token: string): Promise<FebboxQuota | null> {
  try {
    const res = await fetch(`${AURORA_API}/traffic?ui=${token}`);
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

export function FebboxPart() {
  const febboxKey = usePreferencesStore((s) => s.febboxKey);
  const setFebboxKey = usePreferencesStore((s) => s.setFebboxKey);
  const febboxUseMp4 = usePreferencesStore((s) => s.febboxUseMp4);
  const setFebboxUseMp4 = usePreferencesStore((s) => s.setFebboxUseMp4);
  const [enabled, setEnabled] = useState(febboxKey !== null);
  const [status, setStatus] = useState<ValidationStatus>("unset");
  const [quota, setQuota] = useState<FebboxQuota | null>(null);
  const [inputValue, setInputValue] = useState(febboxKey ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!enabled) {
      setStatus("unset");
      setQuota(null);
      setFebboxKey(null);
      return;
    }
    if (inputValue.length < 10) {
      setStatus("unset");
      setQuota(null);
      return;
    }
    setStatus("loading");
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const s = await validateToken(inputValue);
      setStatus(s);
      if (s === "success") {
        setFebboxKey(inputValue);
        const q = await fetchQuota(inputValue);
        setQuota(q);
      } else {
        setFebboxKey(null);
        setQuota(null);
      }
    }, 600);
    return () => clearTimeout(debounceRef.current);
  }, [enabled, inputValue, setFebboxKey]);

  const handleToggle = useCallback(() => {
    if (enabled) {
      setEnabled(false);
      setStatus("unset");
      setQuota(null);
      setFebboxKey(null);
      setInputValue("");
    } else {
      setEnabled(true);
    }
  }, [enabled, setFebboxKey]);

  const handleInputChange = useCallback((val: string) => {
    setInputValue(val);
  }, []);

  if (!conf().ALLOW_FEBBOX_KEY) return null;

  const statusColor = status === "success" ? "text-green-500" : status === "loading" ? "text-yellow-500" : status !== "unset" ? "text-red-500" : "text-gray-500";
  const statusDot = status === "success" ? "bg-green-500" : status === "loading" ? "bg-yellow-500" : status !== "unset" ? "bg-red-500" : "bg-gray-500";

  return (
    <SettingsCard>
      <div className="flex justify-between items-center gap-4">
        <div className="my-3">
          <p className="text-white font-bold mb-3">Febbox (Aurora API)</p>
          <p className="max-w-[30rem] font-medium">
            Bring your own FREE Febbox account to unlock Aurora API — the best sources with 4K quality, Dolby Atmos, and the fastest load times.
          </p>
          <p className="max-w-[30rem] mt-2 text-sm text-type-secondary italic">
            Aurora requires a Febbox token. Your token is never stored on our servers — it is sent directly from your browser to Febbox.
          </p>
        </div>
        <div>
          <Toggle onClick={handleToggle} enabled={enabled} />
        </div>
      </div>
      {enabled ? (
        <>
          <Divider marginClass="my-6 px-8 box-content -mx-8" />
          <p className="text-white font-bold mb-2">Token</p>
          <p className="text-sm text-type-secondary mb-3 max-w-[30rem]">
            Go to febbox.com, log in with Google, open DevTools &gt; Application &gt; Cookies, copy the "ui" cookie value, and paste it here.
          </p>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${statusDot}`} />
            <AuthInputBox
              value={inputValue}
              onChange={handleInputChange}
              placeholder="Paste your Febbox UI token here..."
              passwordToggleable
              className="flex-grow"
            />
          </div>
          <p className={`mt-2 text-sm ${statusColor}`}>
            {status === "loading" ? "Validating token..." : status === "success" ? "Token is valid!" : status === "invalid_token" ? "Invalid or expired token. Please get a new one." : status === "api_down" ? "Cannot reach Aurora API. Please try again later." : status === "error" ? "Failed to validate token." : null}
          </p>
          {status === "success" && quota?.traffic_today_usage ? (
            <p className="text-sm text-green-500 mt-1">
              {quota.traffic_today_usage} / {quota.traffic_limit} High-speed Traffic{quota.reset_at ? ` (resets ${quota.reset_at})` : ""}
            </p>
          ) : null}
          {status === "success" ? (
            <p className="text-xs opacity-70 mt-1">Febbox gives you high-speed traffic per month. Streams may buffer more after you have used your quota.</p>
          ) : null}
          <div className="flex justify-between items-center gap-4 mt-6">
            <div className="my-3">
              <p className="max-w-[32rem] font-medium">Enable MP4 streams. May be faster outside of the U.S., but audio tracks cannot be changed.</p>
            </div>
            <div>
              <Toggle onClick={() => setFebboxUseMp4(!febboxUseMp4)} enabled={febboxUseMp4} />
            </div>
          </div>
        </>
      ) : null}
    </SettingsCard>
  );
}
