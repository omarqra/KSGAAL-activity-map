import type { ReactNode } from "react";

import { PageHeader } from "@/components/dashboard/page-header";
import { Tabs, type Tab } from "@/components/dashboard/tabs";

import { KpiStrip, type KpiItem } from "./kpi-strip";

interface Props {
  meta?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  kpis: KpiItem[];
  tabs?: Tab[];
  defaultTab?: string;
  tabsSlot?: ReactNode;
  children: ReactNode;
}

export function ListPageShell({
  meta,
  title,
  description,
  actions,
  kpis,
  tabs,
  defaultTab,
  tabsSlot,
  children,
}: Props) {
  return (
    <>
      <PageHeader
        meta={meta}
        title={title}
        description={description}
        actions={actions}
      />

      <div className="mx-6 mb-4">
        <KpiStrip items={kpis} />
      </div>

      {tabsSlot ?? (tabs ? <Tabs tabs={tabs} defaultTab={defaultTab} /> : null)}

      <div className="space-y-5 p-6">{children}</div>
    </>
  );
}
