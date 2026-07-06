import classNames from "classnames";
import { Trans, useTranslation } from "react-i18next";

import { ThinContainer } from "@/components/layout/ThinContainer";
import { Heading1, Paragraph } from "@/components/utils/Text";
import { PageTitle } from "@/pages/parts/util/PageTitle";

import { SubPageLayout } from "./layouts/SubPageLayout";

// too lazy to import the actual button component
function Button(props: {
  className: string;
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      className={classNames(
        "font-bold rounded h-10 w-40 scale-90 hover:scale-95 transition-all duration-200",
        props.className,
      )}
      type="button"
      onClick={props.onClick}
      disabled={props.disabled}
    >
      {props.children}
    </button>
  );
}

export function JipPage() {
  const { t } = useTranslation();

  return (
    <SubPageLayout>
      <PageTitle subpage k="global.pages.jip" />
      <ThinContainer>
        <Heading1>{t("jip.title")}</Heading1>
        <Paragraph className="flex flex-col gap-6">
          <Trans
            i18nKey="jip.text"
            components={{
              bold: <span className="font-bold" style={{ color: "#cfcfcf" }} />,
            }}
          />

        </Paragraph>
      </ThinContainer>
    </SubPageLayout>
  );
}
