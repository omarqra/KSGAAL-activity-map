"use client";

import { useMemo, useState } from "react";

import {
  Copy,
  Mail,
  Pencil,
  User as UserIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { type Column } from "@/components/ui/table";
import { cn } from "@/lib/utils";

import {
  EntityAvatar,
  ResourceTable,
  useResourceUrlState,
} from "../../_components/shared";
import type { AdminUser } from "../_lib/api";
import { UserFormSheet } from "./user-form-sheet";

const AVATAR_PALETTE = [
  "#024E28",
  "#193D58",
  "#459AA8",
  "#D56028",
  "#57072D",
  "#474747",
];

interface UserRow {
  id: string;
  source: AdminUser;
  index: number;
  email: string;
  name: string | null;
  displayName: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  avatarColor: string;
  avatarLabel: string;
  [key: string]: unknown;
}

interface UsersUrlState extends Record<string, string | number> {
  q: string;
  isActive: string;
  page: number;
  pageSize: number;
}

function avatarLetters(user: AdminUser): string {
  const source = (user.name ?? user.email).trim();
  if (!source) return "??";
  const letters = source
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("");
  return letters.toUpperCase() || source.slice(0, 2).toUpperCase();
}

function toRows(items: AdminUser[]): UserRow[] {
  return items.map((u, index) => ({
    id: String(u.id),
    source: u,
    index,
    email: u.email,
    name: u.name,
    displayName: u.name ?? u.email,
    role: u.role,
    isActive: u.isActive,
    lastLoginAt: u.lastLoginAt,
    createdAt: u.createdAt,
    avatarColor: AVATAR_PALETTE[index % AVATAR_PALETTE.length],
    avatarLabel: avatarLetters(u),
  }));
}

interface UsersTableProps {
  items: AdminUser[];
}

function formatDate(value: string | null, locale: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(locale === "en" ? "en" : "ar-SA", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function formatDateTime(value: string | null, locale: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(locale === "en" ? "en" : "ar-SA", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function UsersTable({ items }: UsersTableProps) {
  const t = useTranslations("UsersPage");
  const { state, setParams } = useResourceUrlState<UsersUrlState>({
    defaults: { q: "", isActive: "", page: 1, pageSize: 10 },
    numericKeys: ["page", "pageSize"],
  });

  const [viewing, setViewing] = useState<AdminUser | null>(null);
  const [editing, setEditing] = useState<AdminUser | null>(null);

  const locale = t("localeTag");

  // Client-side filtering: API now returns all users, so search and the
  // status filter are applied here against the full list.
  const filteredItems = useMemo(() => {
    let result = items;
    const q = state.q.trim().toLowerCase();
    if (q) {
      result = result.filter((u) => {
        if (u.email.toLowerCase().includes(q)) return true;
        if (u.name && u.name.toLowerCase().includes(q)) return true;
        return false;
      });
    }
    if (state.isActive === "true") {
      result = result.filter((u) => u.isActive);
    } else if (state.isActive === "false") {
      result = result.filter((u) => !u.isActive);
    }
    return result;
  }, [items, state.q, state.isActive]);

  // Client-side pagination over the filtered set.
  const pagedItems = useMemo(() => {
    const start = (state.page - 1) * state.pageSize;
    return filteredItems.slice(start, start + state.pageSize);
  }, [filteredItems, state.page, state.pageSize]);

  const copyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      toast.success(t("toastCopiedEmail"));
    } catch {
      toast.error(t("toastCopyFailed"));
    }
  };

  const columns: Column<UserRow>[] = [
    {
      key: "id",
      label: t("colId"),
      sortable: true,
      render: (row) => (
        <span className="num text-aws-text2 text-[12px]">{row.id}</span>
      ),
    },
    {
      key: "displayName",
      label: t("colUser"),
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <EntityAvatar
            label={row.avatarLabel}
            color={row.avatarColor}
            className="ring-aws-bg shadow-sm ring-2"
          />
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => setViewing(row.source)}
              className="text-aws-text hover:text-aws-link block max-w-[260px] truncate text-start font-semibold transition-colors hover:underline"
            >
              {row.displayName}
            </button>
            <div className="text-aws-text3 num flex items-center gap-1 text-[11px]">
              <Mail className="h-3 w-3 opacity-70" />
              <span className="truncate">{row.email}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "isActive",
      label: t("colStatus"),
      sortable: true,
      render: (row) =>
        row.isActive ? (
          <Badge variant="success" dot>
            {t("statusActive")}
          </Badge>
        ) : (
          <Badge variant="warn" dot>
            {t("statusDisabled")}
          </Badge>
        ),
    },
    {
      key: "lastLoginAt",
      label: t("colLastLogin"),
      sortable: true,
      render: (row) => (
        <span
          className={cn(
            "num text-[12px]",
            row.lastLoginAt ? "text-aws-text2" : "text-aws-text3 italic"
          )}
        >
          {row.lastLoginAt
            ? formatDate(row.lastLoginAt, locale)
            : t("neverLoggedIn")}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: t("colCreatedAt"),
      sortable: true,
      render: (row) => (
        <span className="num text-aws-text2 text-[12px]">
          {formatDate(row.createdAt, locale)}
        </span>
      ),
    },
  ];

  return (
    <>
      <ResourceTable<AdminUser, UserRow>
        urlState={state}
        setParams={setParams}
        resource="users"
        title={
          <>
            {t("tableTitle")}{" "}
            <Badge variant="neutral" className="num">
              {t("tableCount", {
                shown: pagedItems.length,
                total: filteredItems.length,
              })}
            </Badge>
          </>
        }
        description={t("tableDescription")}
        searchPlaceholder={t("searchPlaceholder")}
        items={pagedItems}
        total={filteredItems.length}
        toRows={toRows}
        columns={columns}
        initialSort={{ key: "createdAt", direction: "desc" }}
        selectable={false}
        emptyMessage={t("emptyState")}
        filters={[
          {
            key: "isActive",
            label: t("colStatus"),
            value: state.isActive,
            options: [
              { value: "", label: t("filterAllStatuses") },
              { value: "true", label: t("statusActive") },
              { value: "false", label: t("statusDisabled") },
            ],
            onChange: (value) => setParams({ isActive: value, page: 1 }),
          },
        ]}
        extraRowActions={(user) => [
          {
            key: "view",
            label: t("rowActionView"),
            icon: <UserIcon className="h-3.5 w-3.5" />,
            onClick: () => setViewing(user),
          },
          {
            key: "copy",
            label: t("rowActionCopyEmail"),
            icon: <Copy className="h-3.5 w-3.5" />,
            onClick: () => copyEmail(user.email),
          },
          {
            key: "edit",
            label: t("rowActionEdit"),
            icon: <Pencil className="h-3.5 w-3.5" />,
            onClick: () => setEditing(user),
          },
        ]}
        onDelete={{
          endpoint: (user) => `/api/admin/users/${user.id}`,
          title: t("deleteTitle"),
          message: (user) =>
            t("deleteMessage", { name: user.name ?? user.email }),
          confirmText: t("rowActionDelete"),
          cancelText: t("formActionCancel"),
        }}
        deleteLabel={t("rowActionDelete")}
      />

      <UserFormSheet
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        initial={editing}
      />

      <Sheet
        open={!!viewing}
        onOpenChange={(open) => {
          if (!open) setViewing(null);
        }}
      >
        <SheetContent side="right" className="w-full sm:max-w-md">
          {viewing && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <EntityAvatar
                    label={avatarLetters(viewing)}
                    color={
                      AVATAR_PALETTE[(viewing.id ?? 0) % AVATAR_PALETTE.length]
                    }
                    className="!h-12 !min-w-12 !text-[14px]"
                  />
                  <div className="min-w-0 flex-1">
                    <SheetTitle className="text-start">
                      {viewing.name ?? viewing.email}
                    </SheetTitle>
                    <SheetDescription className="num text-start text-[12px]">
                      {viewing.email}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>
              <div className="space-y-3 px-4 pb-6">
                <DetailRow
                  label={t("colStatus")}
                  value={
                    viewing.isActive ? (
                      <Badge variant="success" dot>
                        {t("statusActive")}
                      </Badge>
                    ) : (
                      <Badge variant="warn" dot>
                        {t("statusDisabled")}
                      </Badge>
                    )
                  }
                />
                <DetailRow
                  label={t("colLastLogin")}
                  value={
                    <span className="num text-aws-text2 text-[13px]">
                      {viewing.lastLoginAt
                        ? formatDateTime(viewing.lastLoginAt, locale)
                        : t("neverLoggedIn")}
                    </span>
                  }
                />
                <DetailRow
                  label={t("colCreatedAt")}
                  value={
                    <span className="num text-aws-text2 text-[13px]">
                      {formatDateTime(viewing.createdAt, locale)}
                    </span>
                  }
                />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

interface DetailRowProps {
  label: string;
  value: React.ReactNode;
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="border-aws-border2 flex items-center justify-between border-b py-2.5 last:border-b-0">
      <span className="text-aws-text3 text-[12px] font-semibold">{label}</span>
      <span className="text-aws-text">{value}</span>
    </div>
  );
}
