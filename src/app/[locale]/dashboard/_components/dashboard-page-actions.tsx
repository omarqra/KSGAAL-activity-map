"use client";

import { useState, useTransition } from "react";

import { Download, Plus, RefreshCw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { CreateActivitySheet } from "./create-activity-sheet";

export function DashboardPageActions() {
  const t = useTranslations("OverviewPage");
  const router = useRouter();
  const locale = useLocale();
  const [refreshing, startRefresh] = useTransition();
  const [exporting, setExporting] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const url = `/api/admin/reports/all/xlsx?locale=${
        locale === "en" ? "en" : "ar"
      }`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const stamp = new Date().toISOString().slice(0, 10);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `activities-${stamp}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      // swallow — user can retry. We avoid noisy alerts here.
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <Button
        variant="default"
        icon={
          <RefreshCw
            className={cn(
              "h-3.5 w-3.5 transition-transform",
              refreshing && "animate-spin"
            )}
          />
        }
        onClick={() => startRefresh(() => router.refresh())}
        disabled={refreshing}
      >
        {t("actionRefresh")}
      </Button>
      <Button
        variant="default"
        icon={<Download className="h-3.5 w-3.5" />}
        onClick={handleExport}
        disabled={exporting}
      >
        {exporting ? t("exportingLabel") : t("actionExport")}
      </Button>
      <Button
        variant="primary"
        icon={<Plus className="h-3.5 w-3.5" />}
        onClick={() => setCreateOpen(true)}
      >
        {t("actionCreate")}
      </Button>

      <CreateActivitySheet open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
