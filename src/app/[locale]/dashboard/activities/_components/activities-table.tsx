"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";

import {
  ResourceTable,
  useResourceUrlState,
} from "../../_components/shared";
import type { Country } from "../../countries/_lib/api";
import type { Organization } from "../../organizations/_lib/api";
import type {
  ActivitySubtype,
  ActivityType,
} from "../../activity-types/_lib/api";
import { fetchActivityTypes } from "../../activity-types/_lib/api";
import { CountryFormSheet } from "../../countries/_components/country-form-sheet";
import { OrganizationFormSheet } from "../../organizations/_components/organization-form-sheet";
import { ActivitySubtypeFormSheet } from "../../activity-types/_components/activity-subtype-form-sheet";
import { ActivityTypeFormSheet } from "../../activity-types/_components/activity-type-form-sheet";
import { type ActivityRow, toRows } from "../_lib/activity-row";
import {
  type ApiActivity,
  fetchActivitySubtypeByIdRaw,
  fetchActivityTypeByIdRaw,
  fetchCountryByIdRaw,
  fetchOrganizationByIdRaw,
} from "../_lib/api";
import { ActivityFormSheet } from "./activity-form-sheet";
import { buildActivityColumns } from "./activities-columns";

interface ActivitiesUrlState extends Record<string, string | number> {
  tab: string;
  q: string;
  status: string;
  typeId: string;
  hostKind: string;
  page: number;
  pageSize: number;
}

interface ActivitiesTableProps {
  items: ApiActivity[];
  total: number;
}

export function ActivitiesTable({ items, total }: ActivitiesTableProps) {
  const t = useTranslations("ActivitiesPage");
  const router = useRouter();
  const [, startTransition] = useTransition();

  const refresh = useCallback(() => {
    startTransition(() => {
      router.refresh();
    });
  }, [router]);

  const { state, setParams } = useResourceUrlState<ActivitiesUrlState>({
    defaults: {
      tab: "all",
      q: "",
      status: "",
      typeId: "",
      hostKind: "",
      page: 1,
      pageSize: 10,
    },
    numericKeys: ["page", "pageSize"],
  });

  const [editing, setEditing] = useState<ApiActivity | null>(null);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [editingType, setEditingType] = useState<ActivityType | null>(null);
  const [editingSubtype, setEditingSubtype] = useState<ActivitySubtype | null>(
    null
  );
  const [mainTypes, setMainTypes] = useState<ActivityType[]>([]);
  const mainTypesLoaded = useRef(false);

  const handleOpenHost = useCallback(async (act: ApiActivity) => {
    if (act.organization) {
      try {
        const org = await fetchOrganizationByIdRaw<Organization>(
          act.organization.id
        );
        setEditingOrg(org);
      } catch (err) {
        console.error("Failed to load organization", err);
      }
      return;
    }
    if (act.country) {
      try {
        const country = await fetchCountryByIdRaw<Country>(act.country.id);
        setEditingCountry(country);
      } catch (err) {
        console.error("Failed to load country", err);
      }
    }
  }, []);

  const handleOpenType = useCallback(async (act: ApiActivity) => {
    try {
      const type = await fetchActivityTypeByIdRaw<ActivityType>(act.type.id);
      setEditingType(type);
    } catch (err) {
      console.error("Failed to load activity type", err);
    }
  }, []);

  const handleOpenSubtype = useCallback(async (act: ApiActivity) => {
    if (!act.subtype) return;
    try {
      const [subtype, types] = await Promise.all([
        fetchActivitySubtypeByIdRaw<ActivitySubtype>(act.subtype.id),
        mainTypesLoaded.current
          ? Promise.resolve(null)
          : fetchActivityTypes(),
      ]);
      if (types) {
        setMainTypes(types);
        mainTypesLoaded.current = true;
      }
      setEditingSubtype(subtype);
    } catch (err) {
      console.error("Failed to load activity subtype", err);
    }
  }, []);

  const columns = useMemo(
    () =>
      buildActivityColumns(t as unknown as (key: string) => string, {
        onOpen: (act) => setEditing(act),
        onOpenHost: handleOpenHost,
        onOpenType: handleOpenType,
        onOpenSubtype: handleOpenSubtype,
      }),
    [t, handleOpenHost, handleOpenType, handleOpenSubtype]
  );

  return (
    <>
      <ResourceTable<ApiActivity, ActivityRow>
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
            key: "hostKind",
            label: t("filterAllHostKinds"),
            value: state.hostKind,
            onChange: (value) => setParams({ hostKind: value, page: 1 }),
            options: [
              { value: "", label: t("filterAllHostKinds") },
              { value: "country", label: t("filterHostCountry") },
              { value: "organization", label: t("filterHostOrganization") },
            ],
          },
        ]}
        onEdit={(act) => setEditing(act)}
        editLabel={t("rowActionEdit")}
        onDelete={{
          title: t("deleteTitle"),
          message: (act) => t("deleteMessage", { name: act.name }),
          endpoint: (act) => `/api/admin/activities/${act.id}`,
          confirmText: t("deleteConfirm"),
          cancelText: t("formActionCancel"),
        }}
        deleteLabel={t("rowActionDelete")}
      />

      <ActivityFormSheet
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        initial={editing}
      />

      <OrganizationFormSheet
        open={!!editingOrg}
        onOpenChange={(open) => {
          if (!open) setEditingOrg(null);
        }}
        initial={editingOrg}
        onSuccess={refresh}
      />

      <CountryFormSheet
        open={!!editingCountry}
        onOpenChange={(open) => {
          if (!open) setEditingCountry(null);
        }}
        initial={editingCountry}
        onSuccess={refresh}
      />

      <ActivityTypeFormSheet
        open={!!editingType}
        onOpenChange={(open) => {
          if (!open) setEditingType(null);
        }}
        initial={editingType}
        onSuccess={refresh}
      />

      <ActivitySubtypeFormSheet
        open={!!editingSubtype}
        onOpenChange={(open) => {
          if (!open) setEditingSubtype(null);
        }}
        initial={editingSubtype}
        mainTypes={mainTypes}
        onSuccess={refresh}
      />
    </>
  );
}
