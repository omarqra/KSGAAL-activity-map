"use client";

import { type ReactNode, useMemo, useState } from "react";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useConfirmDialog } from "@/components/dialog";
import { type SortState, Table } from "@/components/ui/table";

import { ActivityFormSheet } from "../activities/_components/activity-form-sheet";
import { buildActivityColumns } from "../activities/_components/activities-columns";
import { type ActivityRow, toRows } from "../activities/_lib/activity-row";
import type { ApiActivity } from "../activities/_lib/api";

interface ApiEnvelope<T> {
  data: T | null;
  error: { message: string } | null;
}

interface RecentActivitiesTableProps {
  title?: ReactNode;
  description?: ReactNode;
  items: ApiActivity[];
  searchPlaceholder?: string;
}

export function RecentActivitiesTable({
  title,
  description,
  items,
  searchPlaceholder,
}: RecentActivitiesTableProps) {
  const tAct = useTranslations("ActivitiesPage");
  const router = useRouter();
  const confirm = useConfirmDialog();

  const [editing, setEditing] = useState<ApiActivity | null>(null);
  const [busyRowId, setBusyRowId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortState>(null);
  const [refreshing, setRefreshing] = useState(false);

  const t = tAct as unknown as (key: string) => string;

  const columns = useMemo(
    () => buildActivityColumns(t, { onOpen: (act) => handleEdit(act) }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t]
  );

  const allRows = useMemo(() => toRows(items), [items]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allRows;
    return allRows.filter((row) =>
      [
        row.name,
        row.typeLabel,
        row.subtypeLabel ?? "",
        row.hostName,
        row.hostHint,
        row.dateText,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [allRows, search]);

  async function handleEdit(act: ApiActivity) {
    setBusyRowId(String(act.id));
    try {
      const res = await fetch(`/api/admin/activities/${act.id}`, {
        cache: "no-store",
      });
      const json = (await res.json()) as ApiEnvelope<ApiActivity>;
      if (!res.ok || json.error || !json.data) {
        throw new Error(json.error?.message ?? "Load failed");
      }
      setEditing(json.data);
    } catch {
      toast.error(tAct("formErrorGenericUpdate"));
    } finally {
      setBusyRowId(null);
    }
  }

  async function handleDelete(act: ApiActivity) {
    await confirm({
      title: tAct("deleteTitle"),
      message: tAct("deleteMessage", { name: act.name }),
      type: "danger",
      confirmText: tAct("deleteConfirm"),
      cancelText: tAct("formActionCancel"),
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/activities/${act.id}`, {
            method: "DELETE",
          });
          if (!res.ok) throw new Error("Delete failed");
          toast.success("تم الحذف بنجاح");
          router.refresh();
        } catch (err) {
          toast.error("تعذّر الحذف، حاول مرة أخرى");
          throw err;
        }
      },
    });
  }

  const handleRefresh = () => {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <>
      <Table<ActivityRow>
        title={title}
        description={description}
        columns={columns}
        data={filteredRows}
        searchPlaceholder={searchPlaceholder}
        searchValue={search}
        onSearchChange={setSearch}
        sort={sort}
        onSortChange={setSort}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        rowKey={(row) => row.id}
        selectable={false}
        renderRowActions={(row) => {
          const act = row.source;
          const busy = busyRowId === String(act.id);
          return (
            <div className="flex items-center justify-center gap-1">
              <button
                type="button"
                aria-label={tAct("rowActionEdit")}
                title={tAct("rowActionEdit")}
                onClick={() => handleEdit(act)}
                disabled={busy}
                className="text-brand-green hover:bg-brand-green/10 inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors disabled:opacity-50"
              >
                <PencilIcon />
              </button>
              <button
                type="button"
                aria-label={tAct("rowActionDelete")}
                title={tAct("rowActionDelete")}
                onClick={() => handleDelete(act)}
                className="text-brand-wine hover:bg-brand-wine/10 inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors"
              >
                <TrashIcon />
              </button>
            </div>
          );
        }}
      />

      <ActivityFormSheet
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        initial={editing}
      />
    </>
  );
}

function PencilIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    </svg>
  );
}
