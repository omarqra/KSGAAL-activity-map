"use client";

import type { ReactNode } from "react";

import { Tabs, type Tab } from "@/components/dashboard/tabs";

import { useResourceUrlState } from "../../_components/shared";

interface Props {
  tabs: Tab[];
}

interface SerializableTab {
  key: string;
  label: ReactNode;
  badge?: ReactNode;
}

interface OrganizationsTabsState extends Record<string, string | number> {
  tab: string;
  q: string;
  status: string;
  countryId: string;
  page: number;
  pageSize: number;
}

export function OrganizationsTabsBar({ tabs }: Props) {
  const { state, setParams } = useResourceUrlState<OrganizationsTabsState>({
    defaults: {
      tab: "all",
      q: "",
      status: "",
      countryId: "",
      page: 1,
      pageSize: 10,
    },
    numericKeys: ["page", "pageSize"],
  });
  const safeTabs: SerializableTab[] = tabs;
  return (
    <Tabs
      tabs={safeTabs}
      value={state.tab}
      onChange={(key) => setParams({ tab: key, page: 1 })}
    />
  );
}
