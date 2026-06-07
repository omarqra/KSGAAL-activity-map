"use client";

import {
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Loader2, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useConfirmDialog } from "@/components/dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  type Column,
  type QuickFilter,
  type SortState,
  Table,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import type { UrlStateValue } from "./use-resource-url-state";

const SEARCH_DEBOUNCE_MS = 350;

export interface ResourceFilterOption {
  value: string;
  label: string;
}

export interface ResourceFilter {
  key: string;
  label: string;
  value: string;
  options: ResourceFilterOption[];
  onChange: (value: string) => void;
  defaultValue?: string;
}

export interface ResourceRowAction<TItem> {
  key: string;
  label: string;
  icon: ReactNode;
  onClick: (item: TItem) => void;
  variant?: "default" | "destructive";
  hidden?: (item: TItem) => boolean;
}

export interface ResourceTransferTarget {
  id: number;
  label: string;
}

/** BRD feedback #7: when a DELETE is blocked because the record still has
    linked activities (HTTP 409, code HAS_ACTIVITIES), the table opens a
    transfer dialog so the user can move those activities to another record
    before the delete proceeds via `?transferTo=<id>`. */
export interface ResourceTransferConfig<TItem> {
  fetchTargets: (item: TItem) => Promise<ResourceTransferTarget[]>;
  title: string;
  message: (item: TItem, count: number) => string;
  selectLabel: string;
  selectPlaceholder: string;
  confirmText: string;
  cancelText: string;
  successText?: (item: TItem) => string;
  errorText?: string;
}

export interface ResourceDeleteConfig<TItem> {
  endpoint: (item: TItem) => string;
  title: string;
  message: (item: TItem) => string;
  confirmText?: string;
  cancelText?: string;
  method?: "DELETE" | "POST";
  successText?: string | ((item: TItem) => string);
  errorText?: string | ((item: TItem) => string);
  transfer?: ResourceTransferConfig<TItem>;
}

export interface ResourceUrlStateLike {
  q: string;
  page: number;
  pageSize: number;
  [key: string]: UrlStateValue;
}

export interface ResourceTableProps<
  TItem,
  TRow extends { id: string; source: TItem } & Record<string, unknown>,
> {
  // URL state
  urlState: ResourceUrlStateLike;
  setParams: (patch: Partial<ResourceUrlStateLike>) => void;

  // Header
  title: ReactNode;
  description?: ReactNode;
  searchPlaceholder?: string;

  // Data
  items: TItem[];
  total?: number;
  toRows: (items: TItem[]) => TRow[];
  rowKey?: (row: TRow) => string;

  // Columns
  columns: Column<TRow>[];

  // Pagination — omit for client-side-only tables
  serverPagination?: boolean;

  // Filters (rendered as base Table's quickFilters → gives active chips for free)
  filters?: ResourceFilter[];

  // Row actions
  onEdit?: (item: TItem) => void;
  onDelete?: ResourceDeleteConfig<TItem>;
  extraRowActions?: (item: TItem) => ResourceRowAction<TItem>[];

  // Labels for default actions
  editLabel?: string;
  deleteLabel?: string;

  // Sort (uncontrolled by default; pass sort/onSortChange to control)
  initialSort?: SortState;
  sort?: SortState;
  onSortChange?: (next: SortState) => void;

  // Misc
  selectable?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  pageSizeOptions?: number[];

  // Slots passed through
  extraToolbar?: ReactNode;
  bulkActions?: (selectedRows: TRow[], clear: () => void) => ReactNode;
}

export function ResourceTable<
  TItem,
  TRow extends { id: string; source: TItem } & Record<string, unknown>,
>({
  urlState,
  setParams,
  title,
  description,
  searchPlaceholder,
  items,
  total,
  toRows,
  rowKey,
  columns,
  serverPagination = true,
  filters,
  onEdit,
  onDelete,
  extraRowActions,
  editLabel = "تعديل",
  deleteLabel = "حذف",
  initialSort,
  sort: controlledSort,
  onSortChange,
  selectable = false,
  emptyMessage,
  emptyDescription,
  emptyAction,
  pageSizeOptions,
  extraToolbar,
  bulkActions,
}: ResourceTableProps<TItem, TRow>) {
  const router = useRouter();
  const confirm = useConfirmDialog();

  const [transferState, setTransferState] = useState<{
    item: TItem;
    count: number;
    targets: ResourceTransferTarget[];
  } | null>(null);
  const [transferTo, setTransferTo] = useState("");
  const [transferBusy, setTransferBusy] = useState(false);

  const [searchInput, setSearchInput] = useState(urlState.q);
  const [internalSort, setInternalSort] = useState<SortState>(
    initialSort ?? null
  );

  // Sync external URL → input when changed elsewhere
  useEffect(() => {
    setSearchInput(urlState.q);
  }, [urlState.q]);

  // Debounce input → URL
  useEffect(() => {
    const trimmed = searchInput.trim();
    if (trimmed === urlState.q) return;
    const id = setTimeout(
      () => setParams({ q: trimmed, page: 1 }),
      SEARCH_DEBOUNCE_MS
    );
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const rows = useMemo(() => toRows(items), [items, toRows]);

  const isControlledSort = typeof onSortChange === "function";
  const activeSort = isControlledSort ? (controlledSort ?? null) : internalSort;

  const sortedRows = useMemo(() => {
    if (!activeSort) return rows;
    const col = columns.find((c) => c.key === activeSort.key);
    if (!col || !col.sortable) return rows;
    const dir = activeSort.direction === "asc" ? 1 : -1;
    const indexed = rows.map((row, i) => ({ row, i }));
    indexed.sort((a, b) => {
      const av = a.row[activeSort.key];
      const bv = b.row[activeSort.key];
      const cmp = compareValues(av, bv);
      if (cmp !== 0) return cmp * dir;
      return a.i - b.i;
    });
    return indexed.map((x) => x.row);
  }, [rows, columns, activeSort]);

  const genericDeleteError = (item: TItem) =>
    typeof onDelete?.errorText === "function"
      ? onDelete.errorText(item)
      : (onDelete?.errorText ?? "تعذّر الحذف، حاول مرة أخرى");

  const handleDelete = async (item: TItem) => {
    if (!onDelete) return;
    await confirm({
      title: onDelete.title,
      message: onDelete.message(item),
      type: "danger",
      confirmText: onDelete.confirmText ?? deleteLabel,
      cancelText: onDelete.cancelText ?? "إلغاء",
      onConfirm: async () => {
        const res = await fetch(onDelete.endpoint(item), {
          method: onDelete.method ?? "DELETE",
        });
        if (res.ok) {
          const success =
            typeof onDelete.successText === "function"
              ? onDelete.successText(item)
              : (onDelete.successText ?? "تم الحذف بنجاح");
          toast.success(success);
          router.refresh();
          return;
        }
        // Blocked by linked activities → open the transfer dialog (BRD #7).
        let body: { error?: { code?: string; details?: unknown } } | null = null;
        try {
          body = await res.json();
        } catch {
          /* non-JSON */
        }
        if (
          res.status === 409 &&
          body?.error?.code === "HAS_ACTIVITIES" &&
          onDelete.transfer
        ) {
          const count =
            (body.error.details as { activityCount?: number } | undefined)
              ?.activityCount ?? 0;
          try {
            const targets = await onDelete.transfer.fetchTargets(item);
            setTransferState({ item, count, targets });
            setTransferTo("");
          } catch {
            toast.error(genericDeleteError(item));
          }
          return;
        }
        toast.error(genericDeleteError(item));
        throw new Error("Delete failed");
      },
    });
  };

  const performTransfer = async () => {
    if (!onDelete?.transfer || !transferState || !transferTo) return;
    setTransferBusy(true);
    try {
      const res = await fetch(
        `${onDelete.endpoint(transferState.item)}?transferTo=${transferTo}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("Transfer failed");
      toast.success(
        onDelete.transfer.successText?.(transferState.item) ??
          "تم نقل الأنشطة والحذف بنجاح",
      );
      setTransferState(null);
      router.refresh();
    } catch {
      toast.error(onDelete.transfer.errorText ?? genericDeleteError(transferState.item));
    } finally {
      setTransferBusy(false);
    }
  };

  const renderRowActions =
    onEdit || onDelete || extraRowActions
      ? (row: TRow) => {
          const extras = extraRowActions?.(row.source) ?? [];
          return (
            <div className="flex items-center justify-center gap-1">
              {onEdit && (
                <RowIconButton
                  label={editLabel}
                  onClick={() => onEdit(row.source)}
                  icon={<Pencil className="h-3.5 w-3.5" />}
                />
              )}
              {extras
                .filter((a) => !a.hidden?.(row.source))
                .map((a) => (
                  <RowIconButton
                    key={a.key}
                    label={a.label}
                    onClick={() => a.onClick(row.source)}
                    icon={a.icon}
                    variant={a.variant ?? "default"}
                  />
                ))}
              {onDelete && (
                <RowIconButton
                  label={deleteLabel}
                  onClick={() => handleDelete(row.source)}
                  icon={<Trash2 className="h-3.5 w-3.5" />}
                  variant="destructive"
                />
              )}
            </div>
          );
        }
      : undefined;

  const quickFilters: QuickFilter[] | undefined = filters?.map((f) => ({
    key: f.key,
    label: f.label,
    value: f.value,
    options: f.options,
    onChange: f.onChange,
    defaultValue: f.defaultValue,
  }));

  const handleSortChange = (next: SortState) => {
    if (isControlledSort) onSortChange?.(next);
    else setInternalSort(next);
  };

  return (
    <>
    <Table<TRow>
      title={title}
      description={description}
      searchPlaceholder={searchPlaceholder}
      searchValue={searchInput}
      onSearchChange={setSearchInput}
      hideDefaultControls
      toolbar={extraToolbar}
      quickFilters={quickFilters}
      columns={columns}
      data={sortedRows}
      sort={activeSort}
      onSortChange={handleSortChange}
      pagination={
        serverPagination
          ? {
              page: urlState.page,
              pageSize: urlState.pageSize,
              total: total ?? rows.length,
            }
          : undefined
      }
      onPageChange={
        serverPagination ? (next) => setParams({ page: next }) : undefined
      }
      onPageSizeChange={
        serverPagination
          ? (size) => setParams({ pageSize: size, page: 1 })
          : undefined
      }
      onRefresh={() => router.refresh()}
      rowKey={rowKey ?? ((row) => row.id)}
      renderRowActions={renderRowActions}
      selectable={selectable}
      emptyMessage={emptyMessage}
      emptyDescription={emptyDescription}
      emptyAction={emptyAction}
      pageSizeOptions={pageSizeOptions}
      bulkActions={bulkActions}
    />

    {onDelete?.transfer && (
      <Dialog
        open={!!transferState}
        onOpenChange={(open) => {
          if (!open && !transferBusy) setTransferState(null);
        }}
      >
        <DialogContent dir="rtl" className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>{onDelete.transfer.title}</DialogTitle>
            {transferState && (
              <DialogDescription>
                {onDelete.transfer.message(
                  transferState.item,
                  transferState.count,
                )}
              </DialogDescription>
            )}
          </DialogHeader>

          <label className="block">
            <span className="text-aws-text mb-1 block text-[13px] font-semibold">
              {onDelete.transfer.selectLabel}
            </span>
            <select
              value={transferTo}
              onChange={(e) => setTransferTo(e.target.value)}
              disabled={transferBusy}
              className="border-aws-border focus:border-aws-link h-9 w-full rounded border bg-white px-3 text-[13px] outline-none"
              dir="rtl"
            >
              <option value="">{onDelete.transfer.selectPlaceholder}</option>
              {transferState?.targets.map((target) => (
                <option key={target.id} value={target.id}>
                  {target.label}
                </option>
              ))}
            </select>
          </label>

          <DialogFooter>
            <Button
              type="button"
              variant="default"
              onClick={() => setTransferState(null)}
              disabled={transferBusy}
            >
              {onDelete.transfer.cancelText}
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={performTransfer}
              disabled={transferBusy || !transferTo}
              icon={
                transferBusy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : undefined
              }
            >
              {onDelete.transfer.confirmText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )}
    </>
  );
}

interface RowIconButtonProps {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  variant?: "default" | "destructive";
}

function RowIconButton({
  label,
  icon,
  onClick,
  variant = "default",
}: RowIconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors",
        variant === "destructive"
          ? "text-brand-wine hover:bg-brand-wine/10"
          : "text-brand-green hover:bg-brand-green/10"
      )}
    >
      {icon}
    </button>
  );
}

function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() - b.getTime();
  }
  if (typeof a === "string" && typeof b === "string") {
    const da = Date.parse(a);
    const db = Date.parse(b);
    if (!Number.isNaN(da) && !Number.isNaN(db)) return da - db;
    return a.localeCompare(b, undefined, { numeric: true });
  }
  return String(a).localeCompare(String(b), undefined, { numeric: true });
}
