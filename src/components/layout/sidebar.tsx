"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import {
  Activity,
  BookOpen,
  Building2,
  FileBarChart,
  Flag,
  Layers,
  LayoutDashboard,
  type LucideIcon,
  PanelRightClose,
  Shapes,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { usePermissions } from "@/components/permissions/permissions-provider";
import { type Action, type Resource } from "@/lib/permissions";
import { cn } from "@/lib/utils";

import type { SidebarCounts } from "@/app/[locale]/dashboard/_lib/api";

interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
  countKey?: keyof SidebarCounts;
  badge?: string;
  permission?: { resource: Resource; action: Action };
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const sections: NavSection[] = [
  {
    title: "sectionMain",
    items: [
      { label: "navOverview", icon: LayoutDashboard, href: "/dashboard" },
    ],
  },
  {
    title: "sectionManage",
    items: [
      {
        label: "navOrganizations",
        icon: Building2,
        href: "/dashboard/organizations",
        countKey: "organizations",
        permission: { resource: "organizations", action: "read" },
      },
      {
        label: "navCountries",
        icon: Flag,
        href: "/dashboard/countries",
        countKey: "countries",
        permission: { resource: "countries", action: "read" },
      },
      {
        label: "navMainTypes",
        icon: Shapes,
        href: "/dashboard/activity-types?tab=main",
        countKey: "activityTypes",
        permission: { resource: "activityTypes", action: "read" },
      },
      {
        label: "navSubTypes",
        icon: Layers,
        href: "/dashboard/activity-types?tab=sub",
        countKey: "activitySubtypes",
        permission: { resource: "activityTypes", action: "read" },
      },
      {
        label: "navActivities",
        icon: Activity,
        href: "/dashboard/activities",
        countKey: "activities",
        permission: { resource: "activities", action: "read" },
      },
    ],
  },
  {
    title: "sectionTools",
    items: [
      {
        label: "navReports",
        icon: FileBarChart,
        href: "/dashboard/reports",
        permission: { resource: "activities", action: "read" },
      },
    ],
  },
  {
    title: "sectionSettings",
    items: [
      {
        label: "navUsers",
        icon: Users,
        href: "/dashboard/users",
        countKey: "users",
        permission: { resource: "users", action: "read" },
      },
      {
        label: "navRoles",
        icon: ShieldCheck,
        href: "/dashboard/roles",
        permission: { resource: "roles", action: "read" },
      },
    ],
  },
];

interface SidebarProps {
  counts: SidebarCounts;
}

export default function Sidebar({ counts }: SidebarProps) {
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();

  const locale = useLocale();
  const t = useTranslations("Layout");
  const { can } = usePermissions();

  const isActiveLink = (href: string): boolean => {
    if (href === "/dashboard") {
      return /^\/[a-z]{2}\/dashboard\/?$/.test(pathname);
    }
    const [path, query] = href.split("?");
    if (!pathname.includes(path)) return false;
    if (!query) return true;
    const expected = new URLSearchParams(query);
    for (const [key, value] of expected) {
      if ((searchParams?.get(key) ?? null) !== value) return false;
    }
    return true;
  };

  return (
    <aside className="bg-sidebar text-sidebar-foreground fixed start-0 top-19 z-20 h-[calc(100vh-76px)] w-65 shrink-0 overflow-y-auto">
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <span className="bg-brand-green/80 inline-block h-4 w-1 rounded-full" />
          <span className="text-aws-text text-[13px] font-semibold tracking-tight">
            {t("sidebarBrand")}
          </span>
        </div>
        <button
          className="text-aws-text3 hover:text-aws-text rounded-md p-1 transition-colors hover:bg-black/[0.04]"
          aria-label={t("sidebarCollapseAria")}
        >
          <PanelRightClose className="h-4 w-4" />
        </button>
      </div>

      <nav className="pb-3">
        {sections
          .map((section) => ({
            ...section,
            items: section.items.filter(
              (item) =>
                !item.permission ||
                can(item.permission.resource, item.permission.action),
            ),
          }))
          .filter((section) => section.items.length > 0)
          .map((section, idx) => (
          <div key={section.title} className={cn(idx > 0 && "mt-4")}>
            <div className="text-aws-text3/80 px-5 pt-1 pb-1.5 text-[11px] font-semibold">
              {t(section.title as any)}
            </div>
            {section.items.map(
              ({ label, icon: Icon, href, countKey, badge }) => {
                const isActive = isActiveLink(href);
                const count = countKey ? counts[countKey] : undefined;
                return (
                  <Link
                    key={href}
                    href={
                      `/${locale}${href?.startsWith("/") ? href : `/${href}`}` as any
                    }
                    className={cn("side-link", isActive && "active")}
                  >
                    <Icon className="text-aws-text3 h-4 w-4 shrink-0" />
                    <span className="truncate">{t(label as any)}</span>
                    {badge && (
                      <span className="badge badge-info num ms-auto">
                        {badge}
                      </span>
                    )}
                    {!badge && count !== undefined && (
                      <span
                        className={cn(
                          "num ms-auto text-[11px] tabular-nums",
                          isActive ? "text-brand-green/70" : "text-aws-text3/70"
                        )}
                      >
                        {count}
                      </span>
                    )}
                  </Link>
                );
              }
            )}
          </div>
        ))}
      </nav>

      {/* Documentation block */}
      <div className="bg-aws-successBg/60 mx-3 mt-2 mb-4 rounded-xl p-3.5">
        <div className="flex items-start gap-2.5">
          <div className="bg-brand-green/10 text-brand-green mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md">
            <BookOpen className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <div className="text-aws-text text-[12px] font-semibold">
              {t("docsTitle")}
            </div>
            <div className="text-aws-text2 mt-1 text-[11.5px] leading-relaxed">
              {t("docsBody")}
            </div>
            <Link
              href={`/${locale}/dashboard` as any}
              className="text-brand-green hover:text-brand-greenDeep mt-2 inline-flex items-center gap-1 text-[12px] font-semibold transition-colors"
            >
              {t("docsLink")}
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}

