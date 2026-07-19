import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/auth";
import { Heading1 } from "@/components/utils/Text";
import { Icon, Icons } from "@/components/Icon";

export function SyncPart() {
  const { t } = useTranslation();
  const { account } = useAuthStore();

  return (
    <div>
      <Heading1 border className="!mb-0">
        {t("settings.sync.title")}
      </Heading1>
      <div className="mt-4 p-8 rounded-2xl bg-settings-card-background border border-settings-card-border flex flex-col items-center justify-center gap-4 text-center">
        {account ? (
          <>
            <div className="text-emerald-500 text-5xl mb-2 animate-bounce">
              <Icon icon={Icons.CLOUD} />
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <p className="text-lg font-semibold text-type-text">
                Sync Status: Connected
              </p>
            </div>
            <p className="text-sm text-type-dimmed max-w-md">
              Your bookmarks, watch progress, and settings are currently synced automatically to peestream cloud.
            </p>
          </>
        ) : (
          <>
            <div className="text-type-dimmed text-5xl mb-2">
              <Icon icon={Icons.CLOUD} />
            </div>
            <div className="flex items-center gap-2">
              <span className="relative inline-flex rounded-full h-3 w-3 bg-type-dimmed"></span>
              <p className="text-lg font-semibold text-type-dimmed">
                Sync Status: Offline
              </p>
            </div>
            <p className="text-sm text-type-dimmed max-w-md">
              Synchronize your bookmarks, watch progress, and settings across all your devices. Please log in or register under the Account tab to enable cloud sync.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
