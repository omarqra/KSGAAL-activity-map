"use client";

import { useMemo, useState } from "react";

import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { type Column } from "@/components/ui/table";

import {
  EntityAvatar,
  ResourceTable,
  useResourceUrlState,
} from "../../_components/shared";
import type { Country } from "../_lib/api";
import { CountryFormSheet } from "./country-form-sheet";

type BadgeVariant = "info" | "warn" | "neutral" | "success";

interface RegionMeta {
  labelKey: string;
  variant: BadgeVariant;
}

const REGION_LABELS: Record<string, RegionMeta> = {
  gulf: { labelKey: "regionGulf", variant: "info" },
  levant: { labelKey: "regionLevant", variant: "info" },
  north_africa: { labelKey: "regionNorthAfrica", variant: "warn" },
  africa: { labelKey: "regionAfrica", variant: "warn" },
  asia: { labelKey: "regionAsia", variant: "info" },
  europe: { labelKey: "regionEurope", variant: "info" },
  americas: { labelKey: "regionAmericas", variant: "neutral" },
  other: { labelKey: "regionOther", variant: "neutral" },
};

const AVATAR_PALETTE = [
  "#024E28",
  "#193D58",
  "#459AA8",
  "#D56028",
  "#57072D",
  "#474747",
];

function regionMeta(region: string): RegionMeta {
  return REGION_LABELS[region] ?? REGION_LABELS.other;
}

function formatCoord(value: number, positive: string, negative: string) {
  const cardinal = value >= 0 ? positive : negative;
  return `${Math.abs(value).toFixed(4)}°${cardinal}`;
}

interface CountryTableRow {
  id: string;
  source: Country;
  index: number;
  code: string;
  nameAr: string;
  nameEn: string;
  capital: string | null;
  lat: number;
  lng: number;
  hasDetailedMap: boolean;
  region: RegionMeta;
  regionKey: string;
  status: string;
  organizationsCount: number;
  activitiesCount: number;
  avatarColor: string;
  avatarLabel: string;
  [key: string]: unknown;
}

function toRows(items: Country[]): CountryTableRow[] {
  return items.map((c, index) => ({
    id: String(c.id),
    source: c,
    index,
    code: c.code,
    nameAr: c.nameAr,
    nameEn: c.nameEn,
    capital: c.capital,
    lat: c.lat,
    lng: c.lng,
    hasDetailedMap: c.hasDetailedMap,
    region: regionMeta(c.region),
    regionKey: c.region,
    status: c.status,
    organizationsCount: c._count?.organizations ?? 0,
    activitiesCount: c._count?.activities ?? 0,
    avatarColor: AVATAR_PALETTE[index % AVATAR_PALETTE.length],
    avatarLabel: c.code.toUpperCase().slice(0, 2),
  }));
}

interface CountriesUrlState extends Record<string, string | number> {
  tab: string;
  q: string;
  status: string;
  region: string;
  page: number;
  pageSize: number;
}

interface CountriesTableProps {
  items: Country[];
  total: number;
}

export function CountriesTable({ items, total }: CountriesTableProps) {
  const t = useTranslations("CountriesPage");
  const { state, setParams } = useResourceUrlState<CountriesUrlState>({
    defaults: {
      tab: "all",
      q: "",
      status: "",
      region: "",
      page: 1,
      pageSize: 10,
    },
    numericKeys: ["page", "pageSize"],
  });

  const [editing, setEditing] = useState<Country | null>(null);

  const columns: Column<CountryTableRow>[] = useMemo(
    () => [
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
              <div className="text-aws-text3 num text-[11px]">
                cnt-{row.code} · {row.nameEn}
              </div>
            </div>
          </div>
        ),
      },
      {
        key: "regionKey",
        label: t("colRegion"),
        sortable: true,
        render: (row) => (
          <Badge variant={row.region.variant}>
            {t(row.region.labelKey as any)}
          </Badge>
        ),
      },
      {
        key: "capital",
        label: t("colCapital"),
        sortable: true,
        render: (row) =>
          row.capital ? (
            <span className="text-aws-text2 text-[13px]">{row.capital}</span>
          ) : (
            <span className="text-aws-text3">—</span>
          ),
      },
      {
        key: "coords",
        label: t("colCoords"),
        render: (row) => (
          <span className="num text-aws-text2 text-[12px]">
            {formatCoord(row.lat, "N", "S")}, {formatCoord(row.lng, "E", "W")}
          </span>
        ),
      },
      {
        key: "hasDetailedMap",
        label: t("colDetailedMap"),
        render: (row) =>
          row.hasDetailedMap ? (
            <Badge variant="info">{t("detailedMapAvailable")}</Badge>
          ) : (
            <span className="text-aws-text3">—</span>
          ),
      },
      {
        key: "organizationsCount",
        label: t("colOrganizations"),
        sortable: true,
        render: (row) => (
          <span className="num text-aws-text">{row.organizationsCount}</span>
        ),
      },
      {
        key: "activitiesCount",
        label: t("colActivities"),
        sortable: true,
        render: (row) => (
          <span className="num text-aws-text">{row.activitiesCount}</span>
        ),
      },
      {
        key: "status",
        label: t("colStatus"),
        sortable: true,
        render: (row) =>
          row.status === "active" ? (
            <Badge variant="success" dot>
              {t("statusActive")}
            </Badge>
          ) : (
            <Badge variant="warn" dot>
              {t("statusPending")}
            </Badge>
          ),
      },
    ],
    [t]
  );

  return (
    <>
      <ResourceTable<Country, CountryTableRow>
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
        columns={columns}
        filters={[
          {
            key: "region",
            label: t("filterRegionLabel"),
            value: state.region,
            onChange: (value) => setParams({ region: value, page: 1 }),
            options: [
              { value: "", label: t("filterAllRegions") },
              { value: "gulf", label: t("regionGulf") },
              { value: "levant", label: t("regionLevant") },
              { value: "north_africa", label: t("regionNorthAfrica") },
              { value: "africa", label: t("regionAfrica") },
              { value: "asia", label: t("regionAsia") },
              { value: "europe", label: t("regionEurope") },
              { value: "americas", label: t("regionAmericas") },
              { value: "other", label: t("regionOther") },
            ],
          },
          {
            key: "status",
            label: t("filterStatusLabel"),
            value: state.status,
            onChange: (value) => setParams({ status: value, page: 1 }),
            options: [
              { value: "", label: t("filterAllStatuses") },
              { value: "active", label: t("statusActive") },
              { value: "pending", label: t("statusPending") },
            ],
          },
        ]}
        onEdit={(c) => setEditing(c)}
        onDelete={{
          endpoint: (c) => `/api/admin/countries/${c.id}`,
          title: t("deleteTitle"),
          message: (c) => t("deleteMessage", { name: c.nameAr }),
          confirmText: t("deleteConfirm"),
          cancelText: t("formActionCancel"),
        }}
        editLabel={t("rowActionEdit")}
        deleteLabel={t("rowActionDelete")}
      />

      <CountryFormSheet
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        initial={editing}
      />
    </>
  );
}

