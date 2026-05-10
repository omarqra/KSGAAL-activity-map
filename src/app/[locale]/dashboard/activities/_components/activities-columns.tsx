"use client";

import { Building2, Globe2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { Column } from "@/components/ui/table";

import { EntityAvatar } from "../../_components/shared";
import type { ActivityRow } from "../_lib/activity-row";
import type { ApiActivity } from "../_lib/api";

type ColumnsTranslator = (key: string) => string;

interface BuildOptions {
  onOpen?: (activity: ApiActivity) => void;
  onOpenHost?: (activity: ApiActivity) => void;
  onOpenType?: (activity: ApiActivity) => void;
  onOpenSubtype?: (activity: ApiActivity) => void;
}

export function buildActivityColumns(
  t: ColumnsTranslator,
  options: BuildOptions = {}
): Column<ActivityRow>[] {
  const { onOpen, onOpenHost, onOpenType, onOpenSubtype } = options;
  return [
    {
      key: "name",
      label: t("colName"),
      sortable: true,
      render: (row) => (
        <NameCell
          row={row}
          onClick={onOpen ? () => onOpen(row.source) : undefined}
        />
      ),
    },
    {
      key: "typeLabel",
      label: t("colType"),
      sortable: true,
      render: (row) => (
        <TypeCell
          row={row}
          onOpenType={onOpenType ? () => onOpenType(row.source) : undefined}
          onOpenSubtype={
            onOpenSubtype ? () => onOpenSubtype(row.source) : undefined
          }
        />
      ),
    },
    {
      key: "hostName",
      label: t("colHost"),
      sortable: true,
      render: (row) => (
        <HostCell
          row={row}
          kindLabel={
            row.hostKindKey === "organization"
              ? t("hostKindOrganization")
              : row.hostKindKey === "country"
                ? t("hostKindCountry")
                : ""
          }
          onClick={onOpenHost ? () => onOpenHost(row.source) : undefined}
        />
      ),
    },
    {
      key: "dateText",
      label: t("colDate"),
      sortable: true,
      render: (row) => (
        <span className="num text-aws-text2 text-[13px]">{row.dateText}</span>
      ),
    },
    {
      key: "statusLabel",
      label: t("colStatus"),
      sortable: true,
      render: (row) => (
        <Badge variant={row.status.variant} dot>
          {t(row.status.labelKey)}
        </Badge>
      ),
    },
  ];
}

interface NameCellProps {
  row: ActivityRow;
  onClick?: () => void;
}

function NameCell({ row, onClick }: NameCellProps) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="inline-flex h-7 min-w-7 items-center justify-center rounded px-1.5 text-[11px] font-bold text-white"
        style={{ background: row.typeColor }}
      >
        {row.serial.slice(-2)}
      </span>
      <div className="min-w-0">
        {onClick ? (
          <button
            type="button"
            onClick={onClick}
            className="text-aws-link text-start font-semibold hover:underline"
          >
            {row.name}
          </button>
        ) : (
          <span className="text-aws-link font-semibold">{row.name}</span>
        )}
        <div className="text-aws-text3 num text-[11px]">act-{row.serial}</div>
      </div>
    </div>
  );
}

interface TypeCellProps {
  row: ActivityRow;
  onOpenType?: () => void;
  onOpenSubtype?: () => void;
}

function TypeCell({ row, onOpenType, onOpenSubtype }: TypeCellProps) {
  const typeStyle = { background: row.typeColor } as const;
  const subtypeStyle = {
    borderColor: `${row.typeColor}40`,
    color: row.typeColor,
    background: `${row.typeColor}0d`,
  } as const;
  return (
    <div className="flex flex-col gap-1">
      {onOpenType ? (
        <button
          type="button"
          onClick={onOpenType}
          className="inline-flex w-fit items-center gap-1.5 rounded-sm px-2 py-0.5 text-[12px] font-semibold text-white transition hover:opacity-90"
          style={typeStyle}
          title={row.typeLabel}
        >
          {row.typeLabel}
        </button>
      ) : (
        <span
          className="inline-flex w-fit items-center gap-1.5 rounded-sm px-2 py-0.5 text-[12px] font-semibold text-white"
          style={typeStyle}
        >
          {row.typeLabel}
        </span>
      )}
      {row.subtypeLabel &&
        (onOpenSubtype ? (
          <button
            type="button"
            onClick={onOpenSubtype}
            className="inline-flex w-fit items-center rounded-sm border px-2 py-0.5 text-[11px] font-medium transition hover:opacity-80"
            style={subtypeStyle}
            title={row.subtypeLabel}
          >
            {row.subtypeLabel}
          </button>
        ) : (
          <span
            className="inline-flex w-fit items-center rounded-sm border px-2 py-0.5 text-[11px] font-medium"
            style={subtypeStyle}
          >
            {row.subtypeLabel}
          </span>
        ))}
    </div>
  );
}

interface HostCellProps {
  row: ActivityRow;
  kindLabel: string;
  onClick?: () => void;
}

function HostCell({ row, kindLabel, onClick }: HostCellProps) {
  if (row.hostKindKey === "none") {
    return <span className="text-aws-text3">—</span>;
  }
  const HostIcon = row.hostKindKey === "organization" ? Building2 : Globe2;
  const inner = (
    <>
      {row.hostKindKey === "country" ? (
        <span className="text-[16px] leading-none">{row.hostFlag}</span>
      ) : (
        <EntityAvatar label={row.hostName.slice(0, 2)} color="#193D58" />
      )}
      <div className="min-w-0 text-start">
        <div className="text-aws-text flex items-center gap-1 text-[13px] font-semibold">
          <HostIcon className="text-aws-text3 h-3 w-3" />
          <span>{row.hostName}</span>
        </div>
        <div className="text-aws-text3 text-[11px]">
          {kindLabel}
          {row.hostHint ? ` · ${row.hostHint}` : ""}
        </div>
      </div>
    </>
  );
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="hover:bg-aws-border2/30 -mx-1 flex items-center gap-2 rounded px-1 py-0.5 text-start transition"
      >
        {inner}
      </button>
    );
  }
  return <div className="flex items-center gap-2">{inner}</div>;
}
