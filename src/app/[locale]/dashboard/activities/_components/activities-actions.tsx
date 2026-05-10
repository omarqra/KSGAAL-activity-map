"use client";

import { useState, useTransition } from "react";

import { Download, Plus, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import type { ApiActivity } from "../_lib/api";
import { ActivityFormSheet } from "./activity-form-sheet";

interface ApiEnvelope<T> {
  data: T | null;
  error: { message: string } | null;
}

function toCsv(items: ApiActivity[]): string {
  const headers = [
    "id",
    "name",
    "typeKey",
    "typeLabelAr",
    "subtypeLabelAr",
    "hostKind",
    "hostNameAr",
    "hostCode",
    "countryCode",
    "city",
    "dateText",
    "dateParsed",
  ];
  const escape = (val: unknown): string => {
    if (val === null || val === undefined) return "";
    const s = String(val);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const rows = items.map((a) => {
    const hostKind = a.organization ? "organization" : a.country ? "country" : "";
    const hostNameAr = a.organization?.nameAr ?? a.country?.nameAr ?? "";
    const hostCode = a.organization?.code ?? a.country?.code ?? "";
    const countryCode =
      a.country?.code ?? a.organization?.country?.code ?? "";
    const city = a.organization?.city ?? a.country?.capital ?? "";
    return [
      a.id,
      a.name,
      a.type.key,
      a.type.labelAr,
      a.subtype?.labelAr ?? "",
      hostKind,
      hostNameAr,
      hostCode,
      countryCode,
      city,
      a.dateText ?? "",
      a.dateParsed ?? "",
    ]
      .map(escape)
      .join(",");
  });
  return [headers.join(","), ...rows].join("\n");
}

function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([`﻿${content}`], {
    type: `${mime};charset=utf-8`,
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function ActivitiesActions() {
  const t = useTranslations("ActivitiesPage");
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const res = await fetch("/api/admin/activities?pageSize=10000", {
        cache: "no-store",
      });
      const json = (await res.json()) as ApiEnvelope<{
        items: ApiActivity[];
      }>;
      if (json.error || !json.data) throw new Error(json.error?.message);
      const csv = toCsv(json.data.items);
      const stamp = new Date().toISOString().slice(0, 10);
      downloadFile(`activities-${stamp}.csv`, csv, "text/csv");
    } catch {
      // silent — toast layer can be added later
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="default"
        className="rounded-md!"
        icon={
          <RefreshCw
            className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
          />
        }
        onClick={() => startRefresh(() => router.refresh())}
        disabled={refreshing}
      >
        {t("actionRefresh")}
      </Button>
      <Button
        type="button"
        variant="default"
        className="rounded-md!"
        icon={<Download className="h-3.5 w-3.5" />}
        onClick={handleExport}
        disabled={exporting}
      >
        {exporting ? t("actionExporting") : t("actionExport")}
      </Button>
      <Button
        type="button"
        variant="primary"
        className="rounded-md!"
        icon={<Plus className="h-3.5 w-3.5" />}
        onClick={() => setCreateOpen(true)}
      >
        {t("actionCreate")}
      </Button>

      <ActivityFormSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        initial={null}
      />
    </>
  );
}
