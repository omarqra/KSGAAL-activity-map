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

interface CountriesTabsState extends Record<string, string | number> {
  tab: string;
  q: string;
  status: string;
  region: string;
  page: number;
  pageSize: number;
}

export function CountriesTabsBar({ tabs }: Props) {
  const { state, setParams } = useResourceUrlState<CountriesTabsState>({
    defaults: {
      tab: "all",
      q: "",
      status: "",
      region: "",
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
