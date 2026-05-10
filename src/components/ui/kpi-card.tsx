import {
  type LucideIcon,
  Minus,
  MoreHorizontal,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { Badge } from "./badge";

interface KpiCardProps {
  icon: LucideIcon;
  iconColor: string; // hex e.g. '#D56028'
  label: string;
  value: number | string;
  delta?: { value: number; direction: "up" | "down" | "flat" };
  description?: string;
  sparkline?: number[]; // values 0-40 (svg height domain)
  sparklineColor?: string;
}

function deltaBadge(delta: KpiCardProps["delta"]) {
  if (!delta) return null;
  const { value, direction } = delta;
  if (direction === "up")
    return (
      <Badge variant="success" className="num mb-1.5">
        <TrendingUp className="h-3 w-3" />+{value}%
      </Badge>
    );
  if (direction === "down")
    return (
      <Badge variant="error" className="num mb-1.5">
        <TrendingDown className="h-3 w-3" />
        {value}%
      </Badge>
    );
  return (
    <Badge variant="neutral" className="num mb-1.5">
      <Minus className="h-3 w-3" />+{value}%
    </Badge>
  );
}

function sparklinePath(values: number[]) {
  if (values.length === 0) return "";
  const w = 200;
  const h = 36;
  const stepX = w / (values.length - 1);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  return values
    .map((v, i) => {
      const x = i * stepX;
      const y = h - ((v - min) / range) * h * 0.85 - 4;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function KpiCard({
  icon: Icon,
  iconColor,
  label,
  value,
  delta,
  description,
  sparkline,
  sparklineColor,
}: KpiCardProps) {
  return (
    <div className="border-aws-border2 shadow-aws-card rounded-md border bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="svc-tile" style={{ background: iconColor }}>
            <Icon className="h-4 w-4" />
          </div>
          <span className="text-aws-text2 text-[13px] font-semibold">
            {label}
          </span>
        </div>
        {/* <button
          className="text-aws-text3 hover:text-aws-text"
          aria-label="خيارات إضافية"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button> */}
      </div>

      <div className="mt-3 flex items-end gap-2">
        <span className="kpi-num num">{value}</span>
        {deltaBadge(delta)}
      </div>

      {description && (
        <div className="text-aws-text3 mt-0.5 text-[12px]">{description}</div>
      )}

      {sparkline && sparkline.length > 1 && (
        <svg viewBox="0 0 200 36" className="mt-3 h-9 w-full">
          <path
            d={sparklinePath(sparkline)}
            fill="none"
            stroke={sparklineColor ?? iconColor}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
}

