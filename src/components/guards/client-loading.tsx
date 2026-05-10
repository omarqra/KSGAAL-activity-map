import { useTranslations } from "next-intl";
import { RotatingLines } from "react-loader-spinner";

import DefaultTheme from "@/configs/theme";

export default function ClientLoading() {
  const t = useTranslations();
  return (
    <div className="flex min-h-[75vh] w-full flex-col items-center justify-center">
      <RotatingLines
        visible={true}
        height="96"
        width="96"
        color={DefaultTheme.colors.primary}
        strokeWidth="5"
        animationDuration="0.75"
        ariaLabel="rotating-lines-loading"
        wrapperStyle={{}}
        wrapperClass=""
      />
      <p className="text-primary mt-4 text-xl">{t("Loading")}</p>
    </div>
  );
}
