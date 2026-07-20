import isEqual from "lodash.isequal";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { SubtitleStyling } from "@/stores/subtitles";
import { usePreviewThemeStore } from "@/stores/theme";

export function useDerived<T>(
  initial: T,
  label?: string,
): [T, Dispatch<SetStateAction<T>>, () => void, boolean] {
  console.log(`[useDerived:${label}] called with initial:`, initial);
  const [overwrite, setOverwrite] = useState<T | undefined>(undefined);
  useEffect(() => {
    console.log(`[useDerived:${label}] initial changed, resetting overwrite`);
    setOverwrite(undefined);
  }, [initial]);
  const changed = useMemo(
    () => {
      const result = !isEqual(overwrite, initial) && overwrite !== undefined;
      if (result) console.log(`[useDerived:${label}] changed!`, { overwrite, initial });
      return result;
    },
    [overwrite, initial],
  );
  const setter = useCallback<Dispatch<SetStateAction<T>>>(
    (inp) => {
      if (!(inp instanceof Function)) setOverwrite(inp);
      else setOverwrite((s) => inp(s !== undefined ? s : initial));
    },
    [initial, setOverwrite],
  );
  const data = overwrite === undefined ? initial : overwrite;

  const reset = useCallback(() => setOverwrite(undefined), [setOverwrite]);

  console.log(`[useDerived:${label}] returning`, { data, changed });
  return [data, setter, reset, changed];
}

export function useSettingsState(
  theme: string | null,
  appLanguage: string,
  subtitleStyling: SubtitleStyling,
  deviceName: string,
  proxyUrls: string[] | null,
  backendUrl: string | null,
  profile:
    | {
        colorA: string;
        colorB: string;
        icon: string;
      }
    | undefined,
  enableThumbnails: boolean,
  enableAutoplay: boolean,
  sourceOrder: string[],
  enableSourceOrder: boolean,
) {
  console.log('[useSettingsState] CALLED', { theme, appLanguage, subtitleStyling, deviceName, proxyUrls, backendUrl, profile, enableThumbnails, enableAutoplay, sourceOrder, enableSourceOrder });
  
  const [proxyUrlsState, setProxyUrls, resetProxyUrls, proxyUrlsChanged] =
    useDerived(proxyUrls, 'proxyUrls');
  const [backendUrlState, setBackendUrl, resetBackendUrl, backendUrlChanged] =
    useDerived(backendUrl, 'backendUrl');
  const [themeState, setTheme, resetTheme, themeChanged] = useDerived(theme, 'theme');
  const setPreviewTheme = usePreviewThemeStore((s) => s.setPreviewTheme);
  const resetPreviewTheme = useCallback(
    () => setPreviewTheme(theme),
    [setPreviewTheme, theme],
  );
  const [
    appLanguageState,
    setAppLanguage,
    resetAppLanguage,
    appLanguageChanged,
  ] = useDerived(appLanguage, 'appLanguage');
  const [subStylingState, setSubStyling, resetSubStyling, subStylingChanged] =
    useDerived(subtitleStyling, 'subtitleStyling');
  const [
    deviceNameState,
    setDeviceNameState,
    resetDeviceName,
    deviceNameChanged,
  ] = useDerived(deviceName, 'deviceName');
  const [profileState, setProfileState, resetProfile, profileChanged] =
    useDerived(profile, 'profile');
  const [
    enableThumbnailsState,
    setEnableThumbnailsState,
    resetEnableThumbnails,
    enableThumbnailsChanged,
  ] = useDerived(enableThumbnails, 'enableThumbnails');
  const [
    enableAutoplayState,
    setEnableAutoplayState,
    resetEnableAutoplay,
    enableAutoplayChanged,
  ] = useDerived(enableAutoplay, 'enableAutoplay');
  const [
    sourceOrderState,
    setSourceOrderState,
    resetSourceOrder,
    sourceOrderChanged,
  ] = useDerived(sourceOrder, 'sourceOrder');
  const [
    enableSourceOrderState,
    setEnableSourceOrderState,
    resetEnableSourceOrder,
    enableSourceOrderChanged,
  ] = useDerived(enableSourceOrder, 'enableSourceOrder');

  function reset() {
    console.log('[useSettingsState] reset called');
    resetTheme();
    resetPreviewTheme();
    resetAppLanguage();
    resetSubStyling();
    resetProxyUrls();
    resetBackendUrl();
    resetDeviceName();
    resetProfile();
    resetEnableThumbnails();
    resetEnableAutoplay();
    resetSourceOrder();
    resetEnableSourceOrder();
  }

  const changed =
    themeChanged ||
    appLanguageChanged ||
    subStylingChanged ||
    deviceNameChanged ||
    backendUrlChanged ||
    proxyUrlsChanged ||
    profileChanged ||
    enableThumbnailsChanged ||
    enableAutoplayChanged ||
    sourceOrderChanged ||
    enableSourceOrderChanged;

  console.log('[useSettingsState] returning, changed:', changed);

  return {
    reset,
    changed,
    theme: {
      state: themeState,
      set: setTheme,
      changed: themeChanged,
    },
    appLanguage: {
      state: appLanguageState,
      set: setAppLanguage,
      changed: appLanguageChanged,
    },
    subtitleStyling: {
      state: subStylingState,
      set: setSubStyling,
      changed: subStylingChanged,
    },
    deviceName: {
      state: deviceNameState,
      set: setDeviceNameState,
      changed: deviceNameChanged,
    },
    proxyUrls: {
      state: proxyUrlsState,
      set: setProxyUrls,
      changed: proxyUrlsChanged,
    },
    backendUrl: {
      state: backendUrlState,
      set: setBackendUrl,
      changed: backendUrlChanged,
    },
    profile: {
      state: profileState,
      set: setProfileState,
      changed: profileChanged,
    },
    enableThumbnails: {
      state: enableThumbnailsState,
      set: setEnableThumbnailsState,
      changed: enableThumbnailsChanged,
    },
    enableAutoplay: {
      state: enableAutoplayState,
      set: setEnableAutoplayState,
      changed: enableAutoplayChanged,
    },
    sourceOrder: {
      state: sourceOrderState,
      set: setSourceOrderState,
      changed: sourceOrderChanged,
    },
    enableSourceOrder: {
      state: enableSourceOrderState,
      set: setEnableSourceOrderState,
      changed: enableSourceOrderChanged,
    },
  };
}
