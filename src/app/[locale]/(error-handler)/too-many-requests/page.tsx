"use client";

import { useEffect, useState } from "react";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

export default function NotAuthorized() {
  // لو ما عندك ترجمة في client تقدر تحط النص مباشرة
  // أو تجيب الترجمة بطريقة مناسبة client-side
  const t = useTranslations();

  const [disabled, setDisabled] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(60);

  useEffect(() => {
    if (!disabled) return; // إذا مش معطل ما نحتاج المؤقت

    const interval = setInterval(() => {
      setSecondsLeft((sec) => {
        if (sec <= 1) {
          clearInterval(interval);
          setDisabled(false);
          return 0;
        }
        return sec - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [disabled]);

  return (
    <div className="bg-primary flex h-screen w-full flex-col items-center justify-center">
      <div className="bg-primary-foreground rounded-full p-16 text-center">
        <h1 className="text-primary text-8xl font-bold md:text-[150px]">429</h1>
        <p className="text-primary mt-8 text-lg">{t("Too many requests")}</p>
        <div className="mt-4">
          <Button variant="default" size="lg" disabled={disabled}>
            <Link href="/">
              {disabled
                ? `${t("Return to home")} (${secondsLeft})`
                : t("Return to home")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

