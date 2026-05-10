"use client";

import { useMemo, useState } from "react";

import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { type Column } from "@/components/ui/table";

import {
  type ResourceFilter,
  ResourceTable,
  useResourceUrlState,
} from "../../_components/shared";
import type { ActivitySubtype, ActivityType } from "../_lib/api";
import { ActivitySubtypeFormSheet } from "./activity-subtype-form-sheet";

export interface SubtypeRow {
  id: string;
  source: ActivitySubtype;
  subtypeName: string;
  subtypeNameEn: string;
  parentTypeId: number;
  parentName: string;
  parentColor: string;
  activityCount: number;
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

function buildRowsFor(types: ActivityType[]) {
  const meta = new Map<number, { color: string; labelAr: string }>();
  for (const t of types) meta.set(t.id, { color: t.color, labelAr: t.labelAr });

  return (subtypes: ActivitySubtype[]): SubtypeRow[] =>
    subtypes.map((s) => {
      const fromInclude = s.parentType;
      const fromTypes = meta.get(s.parentTypeId);
      return {
        id: String(s.id),
        source: s,
        subtypeName: s.labelAr,
        subtypeNameEn: s.labelEn,
        parentTypeId: s.parentTypeId,
        parentName: fromInclude?.labelAr ?? fromTypes?.labelAr ?? "—",
        parentColor: fromInclude?.color ?? fromTypes?.color ?? "#5F6B7A",
        activityCount: s._count?.activities ?? 0,
      };
    });
}

interface SubtypesTableProps {
  subtypes: ActivitySubtype[];
  mainTypes: ActivityType[];
}

export function SubtypesTable({ subtypes, mainTypes }: SubtypesTableProps) {
  const t = useTranslations("ActivityTypesPage");
  const { state, setParams } = useResourceUrlState<ActivityTypesUrlState>({
    defaults: URL_DEFAULTS,
    numericKeys: ["page", "pageSize"],
  });

  const [editing, setEditing] = useState<ActivitySubtype | null>(null);

  const sortedMainTypes = useMemo(
    () =>
      mainTypes.slice().sort((a, b) => a.labelAr.localeCompare(b.labelAr, "ar")),
    [mainTypes]
  );

  const parentOptions = useMemo(
    () => [
      { value: "", label: t("subFilterAllMain") },
      ...sortedMainTypes.map((m) => ({
        value: String(m.id),
        label: m.labelAr,
      })),
    ],
    [sortedMainTypes, t]
  );

  const filters: ResourceFilter[] = [
    {
      key: "parentTypeId",
      label: t("colParentType"),
      value: state.parentTypeId,
      defaultValue: "",
      options: parentOptions,
      onChange: (value) => setParams({ parentTypeId: value, page: 1 }),
    },
  ];

  const filtered = useMemo(() => {
    const q = state.q.trim().toLowerCase();
    const pid = state.parentTypeId ? Number(state.parentTypeId) : null;
    return subtypes.filter((s) => {
      if (pid && s.parentTypeId !== pid) return false;
      if (!q) return true;
      return (
        s.labelAr.toLowerCase().includes(q) ||
        s.labelEn.toLowerCase().includes(q)
      );
    });
  }, [subtypes, state.q, state.parentTypeId]);

  const toRows = useMemo(() => buildRowsFor(mainTypes), [mainTypes]);

  const columns: Column<SubtypeRow>[] = [
    {
      key: "subtypeName",
      label: t("colSubName"),
      sortable: true,
      render: (row) => (
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => setEditing(row.source)}
            className="text-aws-link text-start font-semibold hover:underline"
          >
            {row.subtypeName}
          </button>
          <div className="text-aws-text3 text-[11px]">
            {t("parentPrefix")}: {row.parentName} · {row.subtypeNameEn}
          </div>
        </div>
      ),
    },
    {
      key: "parentName",
      label: t("colParentType"),
      sortable: true,
      render: (row) => (
        <span
          className="badge"
          style={{
            background: `${row.parentColor}1A`,
            color: row.parentColor,
          }}
        >
          {row.parentName}
        </span>
      ),
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
  ];

  return (
    <>
      <ResourceTable<ActivitySubtype, SubtypeRow>
        urlState={state}
        setParams={setParams}
        title={
          <>
            {t("subTableTitle")}{" "}
            <Badge variant="neutral" className="num">
              {t("subTableCount", { count: filtered.length })}
            </Badge>
          </>
        }
        description={t("subTableDescription")}
        searchPlaceholder={t("subSearchPlaceholder")}
        items={filtered}
        toRows={toRows}
        columns={columns}
        serverPagination={false}
        filters={filters}
        onEdit={(subtype) => setEditing(subtype)}
        onDelete={{
          title: t("deleteSubTitle"),
          message: (s) => t("deleteSubMessage", { name: s.labelAr }),
          endpoint: (s) => `/api/admin/activity-subtypes/${s.id}`,
          confirmText: t("deleteConfirm"),
          cancelText: t("formActionCancel"),
        }}
        editLabel={t("rowActionEdit")}
        deleteLabel={t("rowActionDelete")}
      />

      <ActivitySubtypeFormSheet
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        initial={editing}
        mainTypes={mainTypes}
      />
    </>
  );
}
