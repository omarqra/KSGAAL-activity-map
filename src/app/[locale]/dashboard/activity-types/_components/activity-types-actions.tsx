"use client";

import { useState, useTransition } from "react";

import { Download, Plus, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import { useResourceUrlState } from "../../_components/shared";
import type { ActivitySubtype, ActivityType } from "../_lib/api";
import { ActivitySubtypeFormSheet } from "./activity-subtype-form-sheet";
import { ActivityTypeFormSheet } from "./activity-type-form-sheet";

interface ActivityTypesUrlState extends Record<string, string | number> {
  tab: string;
  q: string;
  parentTypeId: string;
  page: number;
  pageSize: number;
}

const URL_DEFAULTS: ActivityTypesUrlState = {
  tab: "main",
  q: "",
  parentTypeId: "",
  page: 1,
  pageSize: 10,
};

interface ApiEnvelope<T> {
  data: T | null;
  error: { message: string } | null;
}

function csvEscape(val: unknown): string {
  if (val === null || val === undefined) return "";
  const s = String(val);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function typesToCsv(items: ActivityType[]): string {
  const headers = [
    "id",
    "key",
    "labelAr",
    "labelEn",
    "color",
    "subtypesCount",
    "activitiesCount",
    "createdAt",
    "updatedAt",
  ];
  const rows = items.map((t) =>
    [
      t.id,
      t.key,
      t.labelAr,
      t.labelEn,
      t.color,
      t.subtypes?.length ?? 0,
      t._count?.activities ?? 0,
      t.createdAt,
      t.updatedAt,
    ]
      .map(csvEscape)
      .join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

function subtypesToCsv(items: ActivitySubtype[]): string {
  const headers = [
    "id",
    "parentTypeId",
    "parentLabelAr",
    "parentLabelEn",
    "labelAr",
    "labelEn",
    "activitiesCount",
    "createdAt",
    "updatedAt",
  ];
  const rows = items.map((s) =>
    [
      s.id,
      s.parentTypeId,
      s.parentType?.labelAr ?? "",
      s.parentType?.labelEn ?? "",
      s.labelAr,
      s.labelEn,
      s._count?.activities ?? 0,
      s.createdAt,
      s.updatedAt,
    ]
      .map(csvEscape)
      .join(",")
  );
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

interface Props {
  mainTypes: ActivityType[];
}

export function ActivityTypesActions({ mainTypes }: Props) {
  const t = useTranslations("ActivityTypesPage");
  const router = useRouter();
  const { state } = useResourceUrlState<ActivityTypesUrlState>({
    defaults: URL_DEFAULTS,
    numericKeys: ["page", "pageSize"],
  });
  const [refreshing, startRefresh] = useTransition();
  const [createMainOpen, setCreateMainOpen] = useState(false);
  const [createSubOpen, setCreateSubOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const isSub = state.tab === "sub";

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const stamp = new Date().toISOString().slice(0, 10);
      if (isSub) {
        const res = await fetch("/api/admin/activity-subtypes", {
          cache: "no-store",
        });
        const json = (await res.json()) as ApiEnvelope<{
          items: ActivitySubtype[];
        }>;
        if (json.error || !json.data) throw new Error(json.error?.message);
        downloadFile(
          `activity-subtypes-${stamp}.csv`,
          subtypesToCsv(json.data.items),
          "text/csv"
        );
      } else {
        const res = await fetch("/api/admin/activity-types", {
          cache: "no-store",
        });
        const json = (await res.json()) as ApiEnvelope<{
          items: ActivityType[];
        }>;
        if (json.error || !json.data) throw new Error(json.error?.message);
        downloadFile(
          `activity-types-${stamp}.csv`,
          typesToCsv(json.data.items),
          "text/csv"
        );
      }
    } catch {
      // silent — could integrate toast here
    } finally {
      setExporting(false);
    }
  };

  const handleCreate = () => {
    if (isSub) setCreateSubOpen(true);
    else setCreateMainOpen(true);
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
        onClick={handleCreate}
      >
        {isSub ? t("actionCreateSub") : t("actionCreateMain")}
      </Button>

      <ActivityTypeFormSheet
        open={createMainOpen}
        onOpenChange={setCreateMainOpen}
        initial={null}
      />
      <ActivitySubtypeFormSheet
        open={createSubOpen}
        onOpenChange={setCreateSubOpen}
        initial={null}
        mainTypes={mainTypes}
      />
    </>
  );
}
