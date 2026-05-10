import { ACTIVITY_REFERENCE_YEAR, type ApiActivity } from "./api";

export type StatusVariant = "info" | "success" | "neutral" | "warn";

export type DerivedStatusKey = "upcoming" | "active" | "completed" | "tbd";

export interface DerivedStatus {
  key: DerivedStatusKey;
  labelKey: string;
  variant: StatusVariant;
}

export const STATUS_BY_KEY: Record<DerivedStatusKey, DerivedStatus> = {
  upcoming: { key: "upcoming", labelKey: "statusUpcoming", variant: "info" },
  active: { key: "active", labelKey: "statusActive", variant: "success" },
  completed: { key: "completed", labelKey: "statusCompleted", variant: "neutral" },
  tbd: { key: "tbd", labelKey: "statusTbd", variant: "warn" },
};

function extractYear(date: string | null): number | null {
  if (!date) return null;
  const matches = date.match(/(19|20)\d{2}/g);
  if (!matches?.length) return null;
  return matches.map(Number).sort((a, b) => b - a)[0];
}

export function deriveStatus(act: ApiActivity): DerivedStatus {
  const date = act.dateText ?? null;
  const year =
    extractYear(date) ??
    (act.dateParsed ? new Date(act.dateParsed).getUTCFullYear() : null);

  if (!date && year == null) return STATUS_BY_KEY.tbd;
  if (date && /غير\s*محدد/.test(date)) return STATUS_BY_KEY.tbd;
  if (year == null) return STATUS_BY_KEY.tbd;
  if (year > ACTIVITY_REFERENCE_YEAR) return STATUS_BY_KEY.upcoming;
  if (year === ACTIVITY_REFERENCE_YEAR) return STATUS_BY_KEY.active;
  return STATUS_BY_KEY.completed;
}
