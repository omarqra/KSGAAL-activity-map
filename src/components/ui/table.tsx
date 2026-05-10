"use client";

import { type ReactNode, useMemo, useState } from "react";

import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpDown,
  Columns3,
  Inbox,
  Maximize2,
  Minimize2,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export type SortDirection = "asc" | "desc";
export type SortState = { key: string; direction: SortDirection } | null;
export type ColumnAlign = "start" | "center" | "end";
export type TableDensity = "comfortable" | "compact";

export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
  width?: string;
  className?: string;
  sortable?: boolean;
  align?: ColumnAlign;
  hideable?: boolean;
  defaultHidden?: boolean;
}

export interface QuickFilterOption {
  label: string;
  value: string;
}

export interface QuickFilter {
  key: string;
  label: string;
  value: string;
  options: QuickFilterOption[];
  onChange: (value: string) => void;
  defaultValue?: string;
}

interface TableProps<T> {
  title?: ReactNode;
  description?: ReactNode;
  columns: Column<T>[];
  data: T[];
  selectable?: boolean;
  pagination?: { page: number; pageSize: number; total: number };
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onPageChange?: (page: number) => void;
  toolbar?: ReactNode;
  rowKey?: (row: T) => string;
  emptyMessage?: string;
  emptyDescription?: string;
  emptyIcon?: ReactNode;
  emptyAction?: ReactNode;
  renderRowActions?: (row: T) => ReactNode;
  hideDefaultControls?: boolean;
  sort?: SortState;
  onSortChange?: (next: SortState) => void;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
  loading?: boolean;
  density?: TableDensity;
  onDensityChange?: (next: TableDensity) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  bulkActions?: (selectedRows: T[], clear: () => void) => ReactNode;
  quickFilters?: QuickFilter[];
  enableColumnsToggle?: boolean;
}

const ALIGN_CLASS: Record<ColumnAlign, string> = {
  start: "text-start",
  center: "text-center",
  end: "text-end",
};

const ICON_BTN_CLASS =
  "border-aws-border text-aws-text2 hover:border-brand-green hover:text-brand-green hover:bg-brand-green/5 inline-flex h-9 w-9 items-center justify-center rounded-xs border bg-white transition-colors disabled:cursor-not-allowed disabled:opacity-50";

export function Table<T extends Record<string, unknown>>({
  title,
  description,
  columns,
  data,
  selectable = true,
  pagination,
  searchPlaceholder = "تصفية",
  searchValue,
  onSearchChange,
  onPageChange,
  toolbar,
  rowKey = (row) => String((row as { id?: unknown }).id ?? Math.random()),
  emptyMessage = "لا توجد بيانات للعرض",
  emptyDescription,
  emptyIcon,
  emptyAction,
  renderRowActions,
  hideDefaultControls = false,
  sort,
  onSortChange,
  pageSizeOptions = [10, 25, 50, 100],
  onPageSizeChange,
  loading = false,
  density: densityProp,
  onDensityChange,
  onRefresh,
  refreshing = false,
  bulkActions,
  quickFilters,
  enableColumnsToggle = true,
}: TableProps<T>) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [localSort, setLocalSort] = useState<SortState>(null);
  const [localDensity, setLocalDensity] = useState<TableDensity>("comfortable");
  const [localSearch, setLocalSearch] = useState("");
  const [internalSpin, setInternalSpin] = useState(false);
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(() => {
    const s = new Set<string>();
    columns.forEach((c) => {
      if (c.defaultHidden) s.add(c.key);
    });
    return s;
  });

  const isControlledSort = typeof onSortChange === "function";
  const activeSort = isControlledSort ? (sort ?? null) : localSort;
  const isControlledDensity = typeof onDensityChange === "function";
  const density = isControlledDensity
    ? (densityProp ?? "comfortable")
    : localDensity;
  const isControlledSearch = typeof onSearchChange === "function";
  const searchTerm = isControlledSearch ? (searchValue ?? "") : localSearch;
  const setSearch = (v: string) => {
    if (isControlledSearch) onSearchChange?.(v);
    else setLocalSearch(v);
  };

  const visibleColumns = useMemo(
    () => columns.filter((c) => !hiddenCols.has(c.key)),
    [columns, hiddenCols]
  );

  const filteredData = useMemo(() => {
    if (isControlledSearch || !searchTerm.trim()) return data;
    const q = searchTerm.trim().toLowerCase();
    return data.filter((row) => {
      try {
        return JSON.stringify(row).toLowerCase().includes(q);
      } catch {
        return true;
      }
    });
  }, [data, searchTerm, isControlledSearch]);

  const sortedData = useMemo(() => {
    if (isControlledSort || !activeSort) return filteredData;
    const col = columns.find((c) => c.key === activeSort.key);
    if (!col || !col.sortable) return filteredData;
    const dir = activeSort.direction === "asc" ? 1 : -1;
    const indexed = filteredData.map((row, i) => ({ row, i }));
    indexed.sort((a, b) => {
      const av = (a.row as Record<string, unknown>)[activeSort.key];
      const bv = (b.row as Record<string, unknown>)[activeSort.key];
      const cmp = compareValues(av, bv);
      if (cmp !== 0) return cmp * dir;
      return a.i - b.i;
    });
    return indexed.map((x) => x.row);
  }, [filteredData, columns, activeSort, isControlledSort]);

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? new Set(sortedData.map(rowKey)) : new Set());
  };
  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const clearSelection = () => setSelected(new Set());

  const allSelected =
    selectable && sortedData.length > 0 && selected.size === sortedData.length;
  const someSelected = selectable && selected.size > 0 && !allSelected;
  const selectedRows = useMemo(
    () => sortedData.filter((row) => selected.has(rowKey(row))),
    [sortedData, selected, rowKey]
  );

  const handleSortClick = (col: Column<T>) => {
    if (!col.sortable) return;
    const current = activeSort;
    let next: SortState;
    if (!current || current.key !== col.key) {
      next = { key: col.key, direction: "asc" };
    } else if (current.direction === "asc") {
      next = { key: col.key, direction: "desc" };
    } else {
      next = null;
    }
    if (isControlledSort) {
      onSortChange?.(next);
    } else {
      setLocalSort(next);
    }
  };

  const setDensity = (next: TableDensity) => {
    if (isControlledDensity) {
      onDensityChange?.(next);
    } else {
      setLocalDensity(next);
    }
  };

  const toggleColumn = (key: string) => {
    setHiddenCols((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const showActionsCol = !!renderRowActions;
  const totalCols =
    visibleColumns.length + (selectable ? 1 : 0) + (showActionsCol ? 1 : 0);
  const hasHeader = !!(title || description);
  const showBulkBar = selectable && selected.size > 0;

  const activeFilters =
    quickFilters?.filter((f) => f.value !== (f.defaultValue ?? "")) ?? [];

  const showSearch = !hideDefaultControls || isControlledSearch;
  const hasToolbar =
    showSearch ||
    !!toolbar ||
    !hideDefaultControls ||
    (quickFilters && quickFilters.length > 0);

  const handleRefreshClick = () => {
    if (!onRefresh) return;
    setInternalSpin(true);
    try {
      onRefresh();
    } finally {
      window.setTimeout(() => setInternalSpin(false), 700);
    }
  };
  const isSpinning = refreshing || internalSpin;

  const showHeaderRow = hasHeader || hasToolbar;

  return (
    <div className="border-aws-border2 shadow-aws-card overflow-hidden rounded-xs border bg-white">
      {showHeaderRow && (
        <div className="border-aws-border2 flex flex-wrap items-center justify-between gap-3 border-b bg-white px-4 py-2.5">
          {hasHeader && (
            <div className="flex min-w-0 items-stretch gap-2.5">
              <span
                aria-hidden
                className="bg-brand-green my-0.5 w-1 rounded-full"
              />
              <div className="min-w-0">
                {title && (
                  <h3 className="text-aws-text flex items-center gap-2 text-[14px] font-bold tracking-tight">
                    {title}
                  </h3>
                )}
                {description && (
                  <div className="text-aws-text3 mt-0.5 text-[12px]">
                    {description}
                  </div>
                )}
              </div>
            </div>
          )}

          {hasToolbar && (
            <div
              className={cn(
                "flex flex-nowrap items-center gap-2",
                hasHeader && "ms-auto"
              )}
            >
              {showSearch && (
                <div className="border-aws-border focus-within:border-brand-green focus-within:ring-brand-green/15 flex h-9 w-56 items-center gap-2 rounded-xs border bg-white px-3 transition-shadow focus-within:ring-4 lg:w-72">
                  <Search className="text-aws-text3 h-3.5 w-3.5 shrink-0" />
                  <input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearch(e.target.value)}
                    className="placeholder:text-aws-text3/70 flex-1 bg-transparent text-[13px] outline-none"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      aria-label="مسح البحث"
                      className="text-aws-text3 hover:text-aws-text -me-1 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-black/10"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}

              {quickFilters && quickFilters.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {quickFilters.map((qf) => (
                    <QuickFilterChip key={qf.key} filter={qf} />
                  ))}
                </div>
              )}

              {toolbar}

              <div className="flex items-center gap-1.5">
                {!hideDefaultControls && enableColumnsToggle && (
                  <ColumnsMenu
                    columns={columns}
                    hidden={hiddenCols}
                    onToggle={toggleColumn}
                  />
                )}
                {!hideDefaultControls && (
                  <button
                    type="button"
                    onClick={() =>
                      setDensity(
                        density === "compact" ? "comfortable" : "compact"
                      )
                    }
                    aria-label={
                      density === "compact" ? "عرض مريح" : "عرض مدمج"
                    }
                    title={density === "compact" ? "عرض مريح" : "عرض مدمج"}
                    className={ICON_BTN_CLASS}
                  >
                    {density === "compact" ? (
                      <Maximize2 className="h-3.5 w-3.5" />
                    ) : (
                      <Minimize2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
                {onRefresh && (
                  <button
                    type="button"
                    onClick={handleRefreshClick}
                    disabled={isSpinning}
                    aria-label="تحديث الجدول"
                    title="تحديث"
                    className={ICON_BTN_CLASS}
                  >
                    <RefreshCw
                      className={cn(
                        "h-3.5 w-3.5",
                        isSpinning && "animate-spin"
                      )}
                    />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeFilters.length > 0 && (
        <div className="border-aws-border2 flex flex-wrap items-center gap-1.5 border-b bg-white px-4 py-2">
          <span className="text-aws-text3 text-[11px] font-semibold">
            الفلاتر النشطة:
          </span>
          {activeFilters.map((f) => {
            const opt = f.options.find((o) => o.value === f.value);
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => f.onChange(f.defaultValue ?? "")}
                className="border-brand-green/30 bg-brand-green/5 text-brand-green hover:bg-brand-green/10 inline-flex h-6 items-center gap-1.5 rounded-xs border px-2 text-[11px] font-semibold transition-colors"
              >
                <span className="text-aws-text3 font-normal">{f.label}:</span>
                <span>{opt?.label ?? f.value}</span>
                <X className="h-3 w-3" />
              </button>
            );
          })}
        </div>
      )}

      {showBulkBar && (
        <div className="bg-brand-green/5 border-aws-border2 flex flex-wrap items-center gap-2 border-b px-4 py-2.5">
          <button
            type="button"
            onClick={clearSelection}
            aria-label="إلغاء التحديد"
            className="border-brand-green/30 text-brand-green hover:bg-brand-green/10 inline-flex h-7 w-7 items-center justify-center rounded-xs border bg-white transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <span className="text-brand-green num text-[13px] font-semibold">
            {selected.size.toLocaleString("en-US")} محدد
          </span>
          <div className="ms-auto flex items-center gap-2">
            {bulkActions?.(selectedRows, clearSelection)}
          </div>
        </div>
      )}

      <div className="relative overflow-x-auto">
        <table className="aws-table" data-density={density}>
          <thead>
            <tr>
              {selectable && (
                <th
                  style={{ width: 36 }}
                  className="sticky top-0 z-10"
                >
                  <input
                    type="checkbox"
                    aria-label="تحديد كل الصفوف"
                    className="accent-brand-green h-3.5 w-3.5"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={(e) => toggleAll(e.target.checked)}
                  />
                </th>
              )}
              {showActionsCol && (
                <th
                  style={{ width: 96 }}
                  className="text-aws-text2 sticky top-0 z-10 text-center"
                  aria-label="الإجراءات"
                />
              )}
              {visibleColumns.map((col) => {
                const align = col.align ?? "start";
                const isActive = activeSort?.key === col.key;
                const dir = isActive ? activeSort?.direction : null;
                return (
                  <th
                    key={col.key}
                    style={col.width ? { width: col.width } : undefined}
                    data-active={isActive ? "true" : undefined}
                    className={cn(
                      "sticky top-0 z-10",
                      ALIGN_CLASS[align],
                      col.className
                    )}
                  >
                    {col.sortable ? (
                      <button
                        type="button"
                        onClick={() => handleSortClick(col)}
                        className={cn(
                          "group hover:text-brand-green inline-flex items-center gap-1.5 rounded-xs transition-colors select-none",
                          align === "center" && "justify-center",
                          align === "end" && "justify-end",
                          isActive ? "text-brand-green" : "text-aws-text2"
                        )}
                        aria-sort={
                          dir === "asc"
                            ? "ascending"
                            : dir === "desc"
                              ? "descending"
                              : "none"
                        }
                      >
                        <span>{col.label}</span>
                        <SortIcon direction={dir ?? null} active={isActive} />
                      </button>
                    ) : (
                      col.label
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <SkeletonRows
                rows={6}
                columns={visibleColumns}
                selectable={selectable}
                showActionsCol={showActionsCol}
              />
            )}
            {!loading && sortedData.length === 0 && (
              <tr>
                <td colSpan={totalCols} className="py-16">
                  <div className="flex flex-col items-center justify-center gap-3 text-center">
                    <div className="bg-aws-bg text-aws-text3 flex h-14 w-14 items-center justify-center rounded-full">
                      {emptyIcon ?? <Inbox className="h-6 w-6" />}
                    </div>
                    <div>
                      <div className="text-aws-text text-[14px] font-semibold">
                        {searchTerm.trim() && !isControlledSearch
                          ? "لا نتائج مطابقة"
                          : emptyMessage}
                      </div>
                      {emptyDescription && (
                        <div className="text-aws-text3 mt-1 text-[12px]">
                          {emptyDescription}
                        </div>
                      )}
                    </div>
                    {emptyAction && <div className="mt-1">{emptyAction}</div>}
                  </div>
                </td>
              </tr>
            )}
            {!loading &&
              sortedData.map((row) => {
                const id = rowKey(row);
                const isSelected = selected.has(id);
                return (
                  <tr key={id} data-selected={isSelected ? "true" : undefined}>
                    {selectable && (
                      <td>
                        <input
                          type="checkbox"
                          aria-label="تحديد الصف"
                          className="accent-brand-green h-3.5 w-3.5"
                          checked={isSelected}
                          onChange={() => toggleOne(id)}
                        />
                      </td>
                    )}
                    {showActionsCol && (
                      <td className="text-center">
                        <div className="row-actions flex items-center justify-center gap-0.5">
                          {renderRowActions!(row)}
                        </div>
                      </td>
                    )}
                    {visibleColumns.map((col) => {
                      const align = col.align ?? "start";
                      return (
                        <td
                          key={col.key}
                          className={cn(ALIGN_CLASS[align], col.className)}
                        >
                          {col.render
                            ? col.render(row)
                            : String(row[col.key] ?? "—")}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {pagination && (
        <Pagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={pagination.total}
          onPageChange={onPageChange}
          pageSizeOptions={pageSizeOptions}
          onPageSizeChange={onPageSizeChange}
        />
      )}
    </div>
  );
}

function QuickFilterChip({ filter }: { filter: QuickFilter }) {
  const [open, setOpen] = useState(false);
  const isActive = filter.value !== (filter.defaultValue ?? "");
  const current =
    filter.options.find((o) => o.value === filter.value) ?? filter.options[0];
  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-xs border px-3 text-[12px] font-semibold transition-colors",
            isActive
              ? "border-brand-green bg-brand-green/5 text-brand-green"
              : "border-aws-border text-aws-text2 hover:border-brand-green hover:text-brand-green hover:bg-brand-green/5 bg-white"
          )}
        >
          <span className="text-aws-text3 font-normal">{filter.label}:</span>
          <span>{current?.label ?? "—"}</span>
          <ChevronDown
            className={cn(
              "h-3 w-3 transition-transform",
              open && "rotate-180"
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-52 p-1">
        <div className="flex flex-col">
          {filter.options.map((opt) => {
            const active = opt.value === filter.value;
            return (
              <button
                key={opt.value || "__all__"}
                type="button"
                onClick={() => {
                  filter.onChange(opt.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex items-center justify-between rounded-xs px-2.5 py-1.5 text-start text-[13px] transition-colors",
                  active
                    ? "bg-brand-green/10 text-brand-green font-semibold"
                    : "text-aws-text hover:bg-aws-bg"
                )}
              >
                <span>{opt.label}</span>
                {active && (
                  <span
                    aria-hidden
                    className="bg-brand-green inline-block h-1.5 w-1.5 rounded-full"
                  />
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ColumnsMenu<T>({
  columns,
  hidden,
  onToggle,
}: {
  columns: Column<T>[];
  hidden: Set<string>;
  onToggle: (key: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const toggleable = columns.filter((c) => c.hideable !== false);
  if (toggleable.length === 0) return null;
  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="إظهار الأعمدة"
          title="الأعمدة"
          className={ICON_BTN_CLASS}
        >
          <Columns3 className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-2">
        <div className="text-aws-text3 mb-1 px-2 text-[11px] font-semibold tracking-wide uppercase">
          الأعمدة
        </div>
        <div className="flex flex-col">
          {toggleable.map((col) => {
            const isVisible = !hidden.has(col.key);
            return (
              <label
                key={col.key}
                className="text-aws-text hover:bg-aws-bg flex cursor-pointer items-center gap-2 rounded-xs px-2 py-1.5 text-[13px]"
              >
                <input
                  type="checkbox"
                  checked={isVisible}
                  onChange={() => onToggle(col.key)}
                  className="accent-brand-green h-3.5 w-3.5"
                />
                <span className="flex-1">{col.label}</span>
              </label>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function SortIcon({
  direction,
  active = false,
}: {
  direction: SortDirection | null;
  active?: boolean;
}) {
  if (direction === "asc")
    return <ArrowUp className="text-brand-green h-3 w-3" strokeWidth={2.5} />;
  if (direction === "desc")
    return <ArrowDown className="text-brand-green h-3 w-3" strokeWidth={2.5} />;
  return (
    <ChevronsUpDown
      className={cn(
        "h-3 w-3 transition-opacity",
        active
          ? "text-brand-green opacity-90"
          : "text-aws-text3 opacity-40 group-hover:opacity-90"
      )}
    />
  );
}

function SkeletonRows<T>({
  rows,
  columns,
  selectable,
  showActionsCol,
}: {
  rows: number;
  columns: Column<T>[];
  selectable: boolean;
  showActionsCol: boolean;
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={`skeleton-${i}`}>
          {selectable && (
            <td>
              <div className="bg-aws-bg h-3.5 w-3.5 animate-pulse rounded" />
            </td>
          )}
          {showActionsCol && (
            <td>
              <div className="bg-aws-bg mx-auto h-4 w-12 animate-pulse rounded" />
            </td>
          )}
          {columns.map((col, j) => (
            <td key={col.key}>
              <div
                className="bg-aws-bg h-3.5 animate-pulse rounded"
                style={{
                  width: j === 0 ? "70%" : j % 2 === 0 ? "40%" : "55%",
                  animationDelay: `${i * 60}ms`,
                }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
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

function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  pageSizeOptions,
  onPageSizeChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange?: (page: number) => void;
  pageSizeOptions: number[];
  onPageSizeChange?: (size: number) => void;
}) {
  const last = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="border-aws-border2 flex flex-wrap items-center justify-between gap-3 border-t bg-white px-4 py-2.5">
      <div className="text-aws-text3 num text-[12px]">
        عرض <span className="text-aws-text font-semibold">{start}</span>–
        <span className="text-aws-text font-semibold">{end}</span> من{" "}
        <span className="text-aws-text font-semibold">
          {total.toLocaleString("en-US")}
        </span>
      </div>
      <div className="flex items-center gap-4">
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-aws-text3 text-[12px]">صفوف:</span>
            <div className="border-aws-border hover:border-brand-green relative rounded-xs border bg-white transition-colors">
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="num text-aws-text h-7 cursor-pointer appearance-none bg-transparent pe-7 ps-2.5 text-[12px] font-semibold outline-none"
              >
                {pageSizeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <ChevronDown className="text-aws-text3 pointer-events-none absolute end-1.5 top-1/2 h-3 w-3 -translate-y-1/2" />
            </div>
          </div>
        )}
        <Pager page={page} last={last} onPageChange={onPageChange} />
      </div>
    </div>
  );
}

function Pager({
  page,
  last,
  onPageChange,
}: {
  page: number;
  last: number;
  onPageChange?: (page: number) => void;
}) {
  const pages = uniquePages([1, page - 1, page, page + 1, last]).filter(
    (p) => p >= 1 && p <= last
  );
  const go = (next: number) => {
    if (!onPageChange) return;
    const clamped = Math.min(Math.max(1, next), last);
    if (clamped !== page) onPageChange(clamped);
  };
  const navBtn =
    "border-aws-border text-aws-text2 hover:border-brand-green hover:text-brand-green hover:bg-brand-green/5 inline-flex h-7 w-7 items-center justify-center rounded-xs border bg-white transition-colors disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => go(1)}
        className={navBtn}
        disabled={page <= 1 || !onPageChange}
        aria-label="الصفحة الأولى"
      >
        <ChevronsRight className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => go(page - 1)}
        className={navBtn}
        disabled={page <= 1 || !onPageChange}
        aria-label="السابق"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
      {pages.map((p, i) => (
        <span key={`${p}-${i}`} className="contents">
          {i > 0 && pages[i] - pages[i - 1] > 1 && (
            <span className="text-aws-text3 num px-1 text-[12px]">…</span>
          )}
          <button
            type="button"
            onClick={() => go(p)}
            disabled={!onPageChange}
            aria-current={p === page ? "page" : undefined}
            className={cn(
              "border-aws-border text-aws-text2 hover:border-brand-green hover:text-brand-green hover:bg-brand-green/5 num inline-flex h-7 min-w-7 items-center justify-center rounded-xs border bg-white px-2 text-[12px] font-semibold transition-colors disabled:cursor-not-allowed",
              p === page &&
                "bg-brand-green hover:bg-brand-greenDeep border-brand-green! text-white! hover:text-white"
            )}
          >
            {p}
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={() => go(page + 1)}
        className={navBtn}
        disabled={page >= last || !onPageChange}
        aria-label="التالي"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => go(last)}
        className={navBtn}
        disabled={page >= last || !onPageChange}
        aria-label="الصفحة الأخيرة"
      >
        <ChevronsLeft className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function uniquePages(arr: number[]) {
  return Array.from(new Set(arr)).sort((a, b) => a - b);
}
