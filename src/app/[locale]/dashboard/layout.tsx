import { getLocale } from "next-intl/server";

import Breadcrumb from "@/components/layout/breadcrumb";
import Sidebar from "@/components/layout/sidebar";
import TopNav from "@/components/layout/top-nav";
import { requireUser } from "@/lib/auth/require-user";

import { fetchSidebarCounts, type SidebarCounts } from "./_lib/api";

const EMPTY_COUNTS: SidebarCounts = {
  countries: 0,
  organizations: 0,
  activities: 0,
  activityTypes: 0,
  activitySubtypes: 0,
  users: 0,
};

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const user = await requireUser(locale, `/${locale}/dashboard`);
  const counts = await fetchSidebarCounts().catch(() => EMPTY_COUNTS);

  return (
    <div data-app="dashboard">
      <TopNav
        user={{ name: user.name, email: user.email, role: user.role }}
      />
      <Breadcrumb />
      <Sidebar counts={counts} />
      <main className="workspace min-w-0 ms-65 pt-19">{children}</main>
    </div>
  );
}

