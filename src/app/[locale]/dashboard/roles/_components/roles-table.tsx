"use client";

import { useMemo, useState } from "react";

import { Plus, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type Column } from "@/components/ui/table";
import { ACTIONS, RESOURCES } from "@/lib/permissions";

import { ResourceTable, useResourceUrlState } from "../../_components/shared";
import type { Role } from "../_lib/api";
import { RoleFormSheet } from "./role-form-sheet";

interface RoleRow {
  id: string;
  source: Role;
  nameAr: string;
  nameEn: string;
  key: string;
  grants: number;
  userCount: number;
  isSystem: boolean;
  [key: string]: unknown;
}

interface RolesUrlState extends Record<string, string | number> {
  q: string;
  page: number;
  pageSize: number;
}

const URL_DEFAULTS: RolesUrlState = { q: "", page: 1, pageSize: 10 };
const TOTAL_GRANTS = RESOURCES.length * ACTIONS.length;

function countGrants(role: Role): number {
  let n = 0;
  for (const r of RESOURCES) {
    const cell = role.permissions?.[r];
    if (cell) for (const a of ACTIONS) if (cell[a]) n++;
  }
  return n;
}

function buildRows(roles: Role[]): RoleRow[] {
  return roles.map((role) => ({
    id: String(role.id),
    source: role,
    nameAr: role.nameAr,
    nameEn: role.nameEn,
    key: role.key,
    grants: countGrants(role),
    userCount: role.userCount,
    isSystem: role.isSystem,
  }));
}

export function RolesTable({ roles }: { roles: Role[] }) {
  const t = useTranslations("RolesPage");
  const { state, setParams } = useResourceUrlState<RolesUrlState>({
    defaults: URL_DEFAULTS,
    numericKeys: ["page", "pageSize"],
  });

  const [editing, setEditing] = useState<Role | null>(null);
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    const q = state.q.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter(
      (r) =>
        r.key.toLowerCase().includes(q) ||
        r.nameAr.toLowerCase().includes(q) ||
        r.nameEn.toLowerCase().includes(q),
    );
  }, [roles, state.q]);

  const columns: Column<RoleRow>[] = [
    {
      key: "nameAr",
      label: t("colName"),
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <span className="bg-brand-green/10 text-brand-green inline-flex h-8 w-8 items-center justify-center rounded">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => setEditing(row.source)}
              className="text-aws-link text-start font-semibold hover:underline"
            >
              {row.nameAr}
            </button>
            <div className="text-aws-text3 num text-[11px]">
              {row.nameEn} · {row.key}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "grants",
      label: t("colGrants"),
      sortable: true,
      render: (row) => (
        <span className="num text-aws-text2">
          {row.grants} / {TOTAL_GRANTS}
        </span>
      ),
    },
    {
      key: "userCount",
      label: t("colUsers"),
      sortable: true,
      render: (row) => <span className="num">{row.userCount}</span>,
    },
    {
      key: "isSystem",
      label: t("colType"),
      render: (row) =>
        row.isSystem ? (
          <Badge variant="neutral">{t("typeSystem")}</Badge>
        ) : (
          <Badge variant="success" dot>
            {t("typeCustom")}
          </Badge>
        ),
    },
  ];

  return (
    <>
      <ResourceTable<Role, RoleRow>
        urlState={state}
        setParams={setParams}
        resource="roles"
        title={
          <>
            {t("tableTitle")}{" "}
            <Badge variant="neutral" className="num">
              {t("tableCount", { count: filtered.length })}
            </Badge>
          </>
        }
        description={t("tableDescription")}
        searchPlaceholder={t("searchPlaceholder")}
        items={filtered}
        toRows={buildRows}
        columns={columns}
        serverPagination={false}
        extraToolbar={
          <Button
            type="button"
            variant="primary"
            icon={<Plus className="h-3.5 w-3.5" />}
            onClick={() => setCreating(true)}
          >
            {t("addRole")}
          </Button>
        }
        onEdit={(role) => setEditing(role)}
        onDelete={{
          title: t("deleteTitle"),
          message: (role) => t("deleteMessage", { name: role.nameAr }),
          endpoint: (role) => `/api/admin/roles/${role.id}`,
          confirmText: t("deleteConfirm"),
          cancelText: t("formActionCancel"),
          errorText: t("deleteError"),
        }}
        editLabel={t("rowActionEdit")}
        deleteLabel={t("rowActionDelete")}
      />

      <RoleFormSheet
        open={creating}
        onOpenChange={(open) => {
          if (!open) setCreating(false);
        }}
        initial={null}
      />
      <RoleFormSheet
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        initial={editing}
      />
    </>
  );
}
