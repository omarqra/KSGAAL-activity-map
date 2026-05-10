"use client";

import { useMemo, useState } from "react";

import {
  BookOpen,
  Calendar,
  GraduationCap,
  Handshake,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { type Column } from "@/components/ui/table";

import {
  ResourceTable,
  useResourceUrlState,
} from "../../_components/shared";
import type { ActivityType } from "../_lib/api";
import { ActivityTypeFormSheet } from "./activity-type-form-sheet";

interface MainTypeRow {
  id: string;
  source: ActivityType;
  key: string;
  arabicName: string;
  englishLabel: string;
  identifier: string;
  color: string;
  subtypeCount: number;
  activityCount: number;
  icon: LucideIcon;
  updatedAt: string;
  [key: string]: unknown;
}

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

const ICON_MAP: Record<string, LucideIcon> = {
  الفعاليات: Calendar,
  التعليم_والتدريب: GraduationCap,
  البحوث_العلمية_والكتب: BookOpen,
  الشراكات_والاتفاقيات: Handshake,
  اللقاءات_الرسمية: Users,
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toISOString().slice(0, 10);
}

function buildRows(types: ActivityType[]): MainTypeRow[] {
  return types.map((type) => ({
    id: String(type.id),
    source: type,
    key: type.key,
    arabicName: type.labelAr,
    englishLabel: type.labelEn,
    identifier: `type-${type.key.toLowerCase()}`,
    color: type.color,
    subtypeCount: type.subtypes?.length ?? 0,
    activityCount: type._count?.activities ?? 0,
    icon: ICON_MAP[type.key] ?? Calendar,
    updatedAt: formatDate(type.updatedAt),
  }));
}

interface MainTypesTableProps {
  types: ActivityType[];
}

export function MainTypesTable({ types }: MainTypesTableProps) {
  const t = useTranslations("ActivityTypesPage");
  const { state, setParams } = useResourceUrlState<ActivityTypesUrlState>({
    defaults: URL_DEFAULTS,
    numericKeys: ["page", "pageSize"],
  });

  const [editing, setEditing] = useState<ActivityType | null>(null);

  const filtered = useMemo(() => {
    const q = state.q.trim().toLowerCase();
    if (!q) return types;
    return types.filter(
      (type) =>
        type.key.toLowerCase().includes(q) ||
        type.labelAr.toLowerCase().includes(q) ||
        type.labelEn.toLowerCase().includes(q)
    );
  }, [types, state.q]);

  const columns: Column<MainTypeRow>[] = [
    {
      key: "arabicName",
      label: t("colMainName"),
      sortable: true,
      render: (row) => {
        const Icon = row.icon;
        return (
          <div className="flex items-center gap-3">
            <span
              className="svc-tile"
              style={{ background: row.color }}
              aria-hidden
            >
              <Icon className="h-4 w-4 text-white" />
            </span>
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => setEditing(row.source)}
                className="text-aws-link text-start font-semibold hover:underline"
              >
                {row.arabicName}
              </button>
              <div className="text-aws-text3 num text-[11px]">
                {row.englishLabel} · {row.subtypeCount} {t("subtypesSuffix")}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: "subtypeCount",
      label: t("colSubtypeCount"),
      sortable: true,
      render: (row) => <span className="num">{row.subtypeCount}</span>,
    },
    {
      key: "activityCount",
      label: t("colActivityCount"),
      sortable: true,
      render: (row) => <span className="num">{row.activityCount}</span>,
    },
    {
      key: "status",
      label: t("colStatus"),
      render: () => (
        <Badge variant="success" dot>
          {t("statusActive")}
        </Badge>
      ),
    },
    {
      key: "updatedAt",
      label: t("colUpdatedAt"),
      sortable: true,
      render: (row) => (
        <span className="num text-aws-text2">{row.updatedAt}</span>
      ),
    },
  ];

  return (
    <>
      <ResourceTable<ActivityType, MainTypeRow>
        urlState={state}
        setParams={setParams}
        title={
          <>
            {t("mainTableTitle")}{" "}
            <Badge variant="neutral" className="num">
              {t("mainTableCount", { count: filtered.length })}
            </Badge>
          </>
        }
        description={t("mainTableDescription")}
        searchPlaceholder={t("mainSearchPlaceholder")}
        items={filtered}
        toRows={buildRows}
        columns={columns}
        serverPagination={false}
        onEdit={(type) => setEditing(type)}
        onDelete={{
          title: t("deleteMainTitle"),
          message: (type) => t("deleteMainMessage", { name: type.labelAr }),
          endpoint: (type) => `/api/admin/activity-types/${type.id}`,
          confirmText: t("deleteConfirm"),
          cancelText: t("formActionCancel"),
        }}
        editLabel={t("rowActionEdit")}
        deleteLabel={t("rowActionDelete")}
      />

      <ActivityTypeFormSheet
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        initial={editing}
      />
    </>
  );
}
