"use client";

import { useState } from "react";

import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

import { getReportCatalogEntry, type ReportId } from "../_lib/report-catalog";

interface Props {
  id: ReportId;
  count: number;
}

type Format = "xlsx" | "docx";

export function ReportCard({ id, count }: Props) {
  const t = useTranslations("ReportsPage");
  const locale = useLocale();
  const [busy, setBusy] = useState<Format | null>(null);

  const entry = getReportCatalogEntry(id);
  const Icon = entry.icon;

  const download = async (format: Format) => {
    if (busy) return;
    setBusy(format);
    try {
      const url = `/api/admin/reports/${id}/${format}?locale=${locale}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const cd = res.headers.get("Content-Disposition") ?? "";
      const match = cd.match(/filename="?([^"]+)"?/);
      const filename = match?.[1] ?? `report-${id}.${format}`;
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error("[reports] download failed", err);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="border-aws-border2 shadow-aws-card group hover:border-aws-link flex flex-col rounded-md border bg-white p-5 transition-colors">
      <div className="flex items-start gap-3">
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-white"
          style={{ background: entry.accent }}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-aws-text text-[15px] font-bold leading-tight">
            {t(entry.titleKey as any)}
          </h3>
          <p className="text-aws-text2 mt-1 text-[12px] leading-relaxed">
            {t(entry.descriptionKey as any)}
          </p>
        </div>
      </div>

      <div className="text-aws-text3 mt-4 flex items-center gap-2 text-[12px]">
        <Download className="h-3.5 w-3.5" />
        <span className="num font-bold text-aws-text">
          {count.toLocaleString("en-US")}
        </span>
        <span>{t("recordCount")}</span>
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-aws-border2 pt-3">
        <Button
          variant="default"
          size="sm"
          disabled={busy !== null}
          onClick={() => download("xlsx")}
          icon={
            busy === "xlsx" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-3.5 w-3.5" />
            )
          }
        >
          {t("downloadExcel")}
        </Button>
        <Button
          variant="default"
          size="sm"
          disabled={busy !== null}
          onClick={() => download("docx")}
          icon={
            busy === "docx" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileText className="h-3.5 w-3.5" />
            )
          }
        >
          {t("downloadWord")}
        </Button>
      </div>
    </div>
  );
}
