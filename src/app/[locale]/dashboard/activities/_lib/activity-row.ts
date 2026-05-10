import { getTypeColor } from "./activity-meta";
import { deriveStatus, type DerivedStatus } from "./activity-status";
import type { ApiActivity } from "./api";

export type HostKindKey = "country" | "organization" | "none";

export interface ActivityRow {
  id: string;
  source: ApiActivity;
  serial: string;
  name: string;
  typeLabel: string;
  typeColor: string;
  subtypeLabel: string | null;
  hostKindKey: HostKindKey;
  hostName: string;
  hostHint: string;
  hostFlag: string;
  hostCode: string;
  dateText: string;
  status: DerivedStatus;
  statusLabel: string;
  [key: string]: unknown;
}

function flagEmoji(code: string | null | undefined): string {
  if (!code || code.length !== 2) return "🌐";
  const upper = code.toUpperCase();
  const A = 0x1f1e6;
  return String.fromCodePoint(
    A + upper.charCodeAt(0) - 65,
    A + upper.charCodeAt(1) - 65
  );
}

function resolveHostKind(act: ApiActivity): HostKindKey {
  if (act.organization) return "organization";
  if (act.country) return "country";
  return "none";
}

function normalizeColor(value: string | null | undefined): string {
  const v = (value ?? "").trim();
  if (!v) return "";
  return v.startsWith("#") ? v : `#${v}`;
}

function toRow(act: ApiActivity): ActivityRow {
  const flagCode = act.country?.code ?? act.organization?.country?.code ?? null;
  const hostCode = act.organization?.code ?? act.country?.code ?? "—";
  const hostHint = act.organization
    ? (act.organization.city ?? act.organization.country?.nameAr ?? "")
    : (act.country?.capital ?? "");
  const status = deriveStatus(act);
  /* Prefer the color stored on the activity-type row (the admin form picks it
     from the brand palette swatches, so it's already brand-safe). Fall back
     to the visual map only for seeded types that may have no color set. */
  const apiColor = normalizeColor(act.type.color);
  const typeColor = apiColor || getTypeColor(act.type.key);

  return {
    id: String(act.id),
    source: act,
    serial: String(act.id).padStart(4, "0"),
    name: act.name,
    typeLabel: act.type.labelAr,
    typeColor,
    subtypeLabel: act.subtype?.labelAr ?? null,
    hostKindKey: resolveHostKind(act),
    hostName: act.organization?.nameAr ?? act.country?.nameAr ?? "—",
    hostHint,
    hostFlag: flagEmoji(flagCode),
    hostCode: hostCode.toUpperCase(),
    dateText: act.dateText ?? "—",
    status,
    statusLabel: status.labelKey,
  };
}

export function toRows(items: ApiActivity[]): ActivityRow[] {
  return items.map(toRow);
}
