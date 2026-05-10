"use client";

import { useState } from "react";

import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { type Column } from "@/components/ui/table";

import {
  EntityAvatar,
  ResourceTable,
  useResourceUrlState,
} from "../../_components/shared";
import type { Organization } from "../_lib/api";
import { OrganizationFormSheet } from "./organization-form-sheet";

type OrgKindVariant = "info" | "warn" | "success" | "neutral";

interface OrgKind {
  labelKey: string;
  variant: OrgKindVariant;
}

const ORG_KIND: Record<string, OrgKind> = {
  international: { labelKey: "kindInternational", variant: "info" },
  government: { labelKey: "kindGovernment", variant: "warn" },
  university: { labelKey: "kindUniversity", variant: "success" },
  non_profit: { labelKey: "kindNonProfit", variant: "neutral" },
  other: { labelKey: "kindOther", variant: "neutral" },
};

const AVATAR_PALETTE = [
  "#024E28",
  "#193D58",
  "#459AA8",
  "#D56028",
  "#57072D",
  "#474747",
];

type OrgStatusVariant = "success" | "warn" | "neutral";

interface OrgStatus {
  labelKey: string;
  variant: OrgStatusVariant;
}

interface OrganizationRow {
  id: string;
  source: Organization;
  index: number;
  code: string;
  nameAr: string;
  nameEn: string;
  city: string;
  countryNameAr: string;
  countryCode: string;
  activitiesCount: number;
  kind: OrgKind;
  kindLabel: string;
  status: OrgStatus;
  statusLabel: string;
  locationLabel: string;
  registeredAt: string;
  avatarColor: string;
  avatarLabel: string;
  [key: string]: unknown;
}

function mapStatus(status: string): OrgStatus {
  if (status === "pending") {
    return { labelKey: "statusPending", variant: "neutral" };
  }
  return { labelKey: "statusActive", variant: "success" };
}

function mapKind(kind: string): OrgKind {
  return ORG_KIND[kind] ?? { labelKey: "kindOther", variant: "neutral" };
}

function formatDate(value: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toISOString().slice(0, 10);
}

function toRows(items: Organization[]): OrganizationRow[] {
  return items.map((org, index) => ({
    id: String(org.id),
    source: org,
    index,
    code: org.code,
    nameAr: org.nameAr,
    nameEn: org.nameEn,
    city: org.city ?? "—",
    countryNameAr: org.country?.nameAr ?? "—",
    countryCode: (org.country?.code ?? "—").toUpperCase(),
    activitiesCount: org._count?.activities ?? 0,
    kind: mapKind(org.kind),
    kindLabel: mapKind(org.kind).labelKey,
    status: mapStatus(org.status),
    statusLabel: mapStatus(org.status).labelKey,
    locationLabel: `${org.country?.nameAr ?? "—"} · ${org.city ?? "—"}`,
    registeredAt: formatDate(org.createdAt),
    avatarColor: AVATAR_PALETTE[index % AVATAR_PALETTE.length],
    avatarLabel: org.nameAr.trim().slice(0, 2) || "—",
  }));
}

interface OrganizationsUrlState extends Record<string, string | number> {
  tab: string;
  q: string;
  status: string;
  countryId: string;
  page: number;
  pageSize: number;
}

interface OrganizationsTableProps {
  items: Organization[];
  total: number;
}

export function OrganizationsTable({ items, total }: OrganizationsTableProps) {
  const t = useTranslations("OrganizationsPage");
  const { state, setParams } = useResourceUrlState<OrganizationsUrlState>({
    defaults: {
      tab: "all",
      q: "",
      status: "",
      countryId: "",
      page: 1,
      pageSize: 10,
    },
    numericKeys: ["page", "pageSize"],
  });

  const [editing, setEditing] = useState<Organization | null>(null);

  const columns: Column<OrganizationRow>[] = [
    {
      key: "nameAr",
      label: t("colName"),
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <EntityAvatar label={row.avatarLabel} color={row.avatarColor} />
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => setEditing(row.source)}
              className="text-aws-link text-start font-semibold hover:underline"
            >
              {row.nameAr}
            </button>
            {row.nameEn && row.nameEn !== row.nameAr ? (
              <div className="text-aws-text3 text-[11px]">{row.nameEn}</div>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      key: "activitiesCount",
      label: t("colActivities"),
      sortable: true,
      render: (row) => (
        <span className="text-aws-text num">{row.activitiesCount}</span>
      ),
    },
    {
      key: "statusLabel",
      label: t("colStatus"),
      sortable: true,
      render: (row) => (
        <Badge variant={row.status.variant} dot>
          {t(row.status.labelKey as any)}
        </Badge>
      ),
    },
    {
      key: "registeredAt",
      label: t("colRegisteredAt"),
      sortable: true,
      render: (row) => (
        <span className="num text-aws-text2">{row.registeredAt}</span>
      ),
    },
  ];

  return (
    <>
      <ResourceTable<Organization, OrganizationRow>
        urlState={state}
        setParams={setParams}
        title={
          <>
            {t("tableTitle")}{" "}
            <Badge variant="neutral" className="num">
              {t("tableCount", { shown: items.length, total })}
            </Badge>
          </>
        }
        description={t("tableDescription")}
        searchPlaceholder={t("searchPlaceholder")}
        items={items}
        total={total}
        toRows={toRows}
        rowKey={(row) => row.id}
        columns={columns}
        filters={[
          {
            key: "status",
            label: t("filterAllStatuses"),
            value: state.status,
            onChange: (v) => setParams({ status: v, page: 1 }),
            options: [
              { value: "", label: t("filterAllStatuses") },
              { value: "active", label: t("statusActive") },
              { value: "pending", label: t("statusPending") },
            ],
          },
        ]}
        onEdit={(org) => setEditing(org)}
        editLabel={t("rowActionEdit")}
        onDelete={{
          title: t("deleteTitle"),
          message: (org) => t("deleteMessage", { name: org.nameAr }),
          endpoint: (org) => `/api/admin/organizations/${org.id}`,
          confirmText: t("deleteConfirm"),
          cancelText: t("formActionCancel"),
        }}
        deleteLabel={t("rowActionDelete")}
      />

      <OrganizationFormSheet
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        initial={editing}
      />
    </>
  );
}
