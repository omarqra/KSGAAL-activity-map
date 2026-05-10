import type { LucideIcon } from "lucide-react";

import { KpiCard } from "@/components/ui/kpi-card";

export interface KpiItem {
  icon: LucideIcon;
  iconColor: string;
  label: string;
  value: number | string;
  delta?: { value: number; direction: "up" | "down" | "flat" };
  description?: string;
}

interface Props {
  items: KpiItem[];
}

export function KpiStrip({ items }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items?.map((kpi) => (
        <KpiCard key={kpi.label} {...kpi} />
      ))}
    </div>
  );
}

