"use client";

import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ComingSoonOverlayProps {
  className?: string;
}

export default function ComingSoonOverlay({
  className,
}: ComingSoonOverlayProps) {
  const t = useTranslations();

  return (
    <div
      className={cn(
        "border-primary/40 bg-primary/5 text-primary flex items-center gap-3 rounded-xl border border-dashed px-4 py-3 text-sm",
        className
      )}
    >
      <Icon icon="mdi:hammer-wrench" className="size-5 shrink-0" />
      <div className="flex flex-1 flex-col">
        <span className="font-semibold">{t("Coming soon")}</span>
        <span className="text-muted-foreground text-xs">
          {t("ComingSoonDescription")}
        </span>
      </div>
      <Badge variant="neutral" className="shrink-0">
        {t("Static preview")}
      </Badge>
    </div>
  );
}

