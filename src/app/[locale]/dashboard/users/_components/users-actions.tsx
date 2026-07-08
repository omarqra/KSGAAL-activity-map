"use client";

import { useState, useTransition } from "react";

import { Download, Plus, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { usePermission } from "@/components/permissions/permissions-provider";

import type { AdminUser } from "../_lib/api";
import { UserFormSheet } from "./user-form-sheet";

interface ApiEnvelope<T> {
  data: T | null;
  error: { message: string } | null;
}

function toCsv(items: AdminUser[]): string {
  const headers = [
    "id",
    "email",
    "name",
    "role",
    "isActive",
    "lastLoginAt",
    "passwordChangedAt",
    "createdAt",
  ];
  const escape = (val: unknown): string => {
    if (val === null || val === undefined) return "";
    const s = String(val);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const rows = items.map((u) =>
    [
      u.id,
      u.email,
      u.name ?? "",
      u.role,
      u.isActive,
      u.lastLoginAt ?? "",
      u.passwordChangedAt,
      u.createdAt,
    ]
      .map(escape)
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

export function UsersActions() {
  const t = useTranslations("UsersPage");
  const canCreate = usePermission("users", "create");
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const [exporting, setExporting] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const res = await fetch("/api/admin/users?pageSize=10000", {
        cache: "no-store",
      });
      const json = (await res.json()) as ApiEnvelope<{ items: AdminUser[] }>;
      if (json.error || !json.data) throw new Error(json.error?.message);
      const csv = toCsv(json.data.items);
      const stamp = new Date().toISOString().slice(0, 10);
      downloadFile(`users-${stamp}.csv`, csv, "text/csv");
    } catch {
      // silent
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
      {canCreate && (
      <Button
        type="button"
        variant="primary"
        icon={<Plus className="h-3.5 w-3.5" />}
        onClick={() => setCreateOpen(true)}
      >
        {t("actionCreate")}
      </Button>
      )}

      <UserFormSheet open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
