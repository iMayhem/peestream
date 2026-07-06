import classNames from "classnames";
import { Trans, useTranslation } from "react-i18next";

import { ThinContainer } from "@/components/layout/ThinContainer";

import { Heading1, Paragraph } from "@/components/utils/Text";
import { PageTitle } from "@/pages/parts/util/PageTitle";

import { SubPageLayout } from "./layouts/SubPageLayout";

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

export function SupportPage() {
  const { t } = useTranslation();

  return (
    <SubPageLayout>
      <PageTitle subpage k="global.pages.support" />
      <ThinContainer>
        <Heading1>{t("support.title")}</Heading1>
        <Paragraph>
          <Trans
            i18nKey="support.text"
            components={{
              bold: <span className="font-bold" style={{ color: "#cfcfcf" }} />,
            }}
          />
          <div className="pt-6">
            <Button
              className="py px-4 box-content bg-buttons-secondary hover:bg-buttons-secondaryHover bg-opacity-90 text-buttons-secondaryText justify-center items-center inline-block"
              onClick={() => window.open("https://docs.undi.rest", "_blank")}
            >
              Peestream Docs
            </Button>
          </div>
        </Paragraph>

      </ThinContainer>
    </SubPageLayout>
  );
}
