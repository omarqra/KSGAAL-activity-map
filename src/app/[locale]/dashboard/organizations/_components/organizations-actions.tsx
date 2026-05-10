"use client";

import { useState, useTransition } from "react";

import { Download, Plus, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import type { Organization } from "../_lib/api";
import { OrganizationFormSheet } from "./organization-form-sheet";

interface ApiEnvelope<T> {
  data: T | null;
  error: { message: string } | null;
}

function toCsv(items: Organization[]): string {
  const headers = [
    "code",
    "nameAr",
    "nameEn",
    "short",
    "kind",
    "status",
    "city",
    "country",
    "lat",
    "lng",
    "activitiesCount",
    "createdAt",
  ];
  const escape = (val: unknown): string => {
    if (val === null || val === undefined) return "";
    const s = String(val);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const rows = items.map((o) =>
    [
      o.code,
      o.nameAr,
      o.nameEn,
      o.short,
      o.kind,
      o.status,
      o.city ?? "",
      o.country?.nameAr ?? "",
      o.lat,
      o.lng,
      o._count?.activities ?? 0,
      o.createdAt,
    ]
      .map(escape)
      .join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([`﻿${content}`], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function OrganizationsActions() {
  const t = useTranslations("OrganizationsPage");
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const res = await fetch("/api/admin/organizations?pageSize=10000", {
        cache: "no-store",
      });
      const json = (await res.json()) as ApiEnvelope<{
        items: Organization[];
      }>;
      if (json.error || !json.data) throw new Error(json.error?.message);
      const csv = toCsv(json.data.items);
      const stamp = new Date().toISOString().slice(0, 10);
      downloadFile(`organizations-${stamp}.csv`, csv, "text/csv");
    } catch {
      // silent — could integrate toast here
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="default"
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
        icon={<Download className="h-3.5 w-3.5" />}
        onClick={handleExport}
        disabled={exporting}
      >
        {exporting ? t("actionExporting") : t("actionExport")}
      </Button>
      <Button
        type="button"
        variant="primary"
        icon={<Plus className="h-3.5 w-3.5" />}
        onClick={() => setCreateOpen(true)}
      >
        {t("actionCreate")}
      </Button>

      <OrganizationFormSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        initial={null}
      />
    </>
  );
}
