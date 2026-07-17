import { useTranslation } from "react-i18next";

import { Heading1 } from "@/components/utils/Text";

export function SyncPart() {
  const { t } = useTranslation();

  return (
    <div className="opacity-40 pointer-events-none select-none">
      <Heading1 border className="!mb-0">
        {t("settings.sync.title")}
      </Heading1>
      <div className="mt-4 p-8 rounded-2xl bg-settings-card-background border border-settings-card-border flex flex-col items-center justify-center gap-4 text-center">
        <p className="text-4xl">🚧</p>
        <p className="text-lg font-semibold text-type-dimmed">
          {t("settings.sync.comingSoon")}
        </p>
        <p className="text-sm text-type-dimmed max-w-md">
          {t("settings.sync.description")}
        </p>
      </div>
    </div>
  );
}
