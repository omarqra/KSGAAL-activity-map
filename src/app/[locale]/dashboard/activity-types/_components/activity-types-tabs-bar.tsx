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

interface ActivityTypesUrlState extends Record<string, string | number> {
  tab: string;
  q: string;
  parentTypeId: string;
  page: number;
  pageSize: number;
}

const URL_DEFAULTS: ActivityTypesUrlState = {
  tab: "main",
  q: "",
  parentTypeId: "",
  page: 1,
  pageSize: 10,
};

export function ActivityTypesTabsBar({ tabs }: Props) {
  const { state, setParams } = useResourceUrlState<ActivityTypesUrlState>({
    defaults: URL_DEFAULTS,
    numericKeys: ["page", "pageSize"],
  });
  const safeTabs: SerializableTab[] = tabs;
  return (
    <Tabs
      tabs={safeTabs}
      value={state.tab}
      onChange={(key) =>
        setParams({
          tab: key === "sub" ? "sub" : "main",
          q: "",
          parentTypeId: "",
          page: 1,
        })
      }
    />
  );
}
