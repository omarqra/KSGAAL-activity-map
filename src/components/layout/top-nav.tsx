"use client";

import { useMemo, useRef, useState } from "react";

import Image from "next/image";
import { useParams, useSearchParams } from "next/navigation";

import {
  Activity,
  Building2,
  Check,
  ChevronDown,
  CircleHelp,
  Flag,
  Globe2,
  LayoutDashboard,
  Layers,
  LogOut,
  Search,
  Shapes,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import FontSwitcher from "@/components/layout/font-switcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Locale,
  usePathname as useIntlPathname,
  useRouter as useIntlRouter,
} from "@/i18n/routing";
import { cn } from "@/lib/utils";

interface SearchablePage {
  labelKey: string;
  href: string;
  icon: LucideIcon;
  keywords: string[];
}

const SEARCHABLE_PAGES: SearchablePage[] = [
  {
    labelKey: "navOverview",
    href: "/dashboard",
    icon: LayoutDashboard,
    keywords: ["overview", "home", "نظرة", "عامة", "الرئيسية", "لوحة"],
  },
  {
    labelKey: "navActivities",
    href: "/dashboard/activities",
    icon: Activity,
    keywords: ["activities", "أنشطة", "الأنشطة", "نشاط"],
  },
  {
    labelKey: "navOrganizations",
    href: "/dashboard/organizations",
    icon: Building2,
    keywords: ["organizations", "orgs", "منظمات", "المنظمات", "جهات"],
  },
  {
    labelKey: "navCountries",
    href: "/dashboard/countries",
    icon: Flag,
    keywords: ["countries", "دول", "الدول", "بلد"],
  },
  {
    labelKey: "navMainTypes",
    href: "/dashboard/activity-types?tab=main",
    icon: Shapes,
    keywords: [
      "activity types",
      "main types",
      "أنواع",
      "رئيسية",
      "أنواع الأنشطة",
    ],
  },
  {
    labelKey: "navSubTypes",
    href: "/dashboard/activity-types?tab=sub",
    icon: Layers,
    keywords: ["subtypes", "sub", "فرعية", "أنواع فرعية"],
  },
  {
    labelKey: "navGlobe",
    href: "/globe",
    icon: Globe2,
    keywords: ["globe", "map", "earth", "كرة", "خريطة", "العالم"],
  },
  {
    labelKey: "navUsers",
    href: "/dashboard/users",
    icon: Users,
    keywords: ["users", "team", "مستخدمين", "المستخدمين", "فريق"],
  },
];

export type TopNavUser = {
  name: string | null;
  email: string;
  role?: string;
};

export default function TopNav({ user }: { user?: TopNavUser } = {}) {
  const t = useTranslations("Layout");
  const locale = useLocale();

  const intlRouter = useIntlRouter();
  const intlPathname = useIntlPathname();
  const searchParams = useSearchParams();
  const params = useParams();

  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchWrapperRef = useRef<HTMLDivElement>(null);

  const matches = useMemo(() => {
    if (!query.trim()) return SEARCHABLE_PAGES;
    const q = query.trim().toLowerCase();
    return SEARCHABLE_PAGES.filter((page) => {
      const label = t(page.labelKey as any).toLowerCase();
      if (label.includes(q)) return true;
      return page.keywords.some((k) => k.toLowerCase().includes(q));
    });
  }, [query, t]);

  const handleSelectPage = (href: string) => {
    setSearchOpen(false);
    setQuery("");
    window.location.href = `/${locale}${href.startsWith("/") ? href : `/${href}`}`;
  };

  const handleNavigate = (href: string) => {
    window.location.href = `/${locale}${href.startsWith("/") ? href : `/${href}`}`;
  };

  const handleSelectLocale = (nextLocale: Locale) => {
    if (nextLocale === locale) return;
    let path = intlPathname;
    const search = searchParams?.toString();
    if (search) path += `?${search}`;
    intlRouter.replace(
      // @ts-expect-error -- runtime path is always a valid match for current params
      { pathname: path, params },
      { locale: nextLocale }
    );
  };

  const displayName = user?.name?.trim() || user?.email || t("topNavUserName");
  const roleLabel = (() => {
    if (!user?.role) return null;
    const key = user.role.toLowerCase();
    if (key === "admin") return t("roleAdmin");
    if (key === "user") return t("roleUser");
    return user.role;
  })();
  const initials = (() => {
    const src = user?.name?.trim() || user?.email || "AM";
    const parts = src.split(/[\s@.]+/).filter(Boolean);
    const first = parts[0]?.[0] ?? "A";
    const second = parts[1]?.[0] ?? "M";
    return (first + second).toUpperCase();
  })();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
    } finally {
      const loginPath = locale === "en" ? "/login" : "/تسجيل الدخول";
      window.location.href = `/${locale}${loginPath}`;
    }
  };

  return (
    <header className="bg-brand-green fixed inset-x-0 top-0 z-40 flex h-10 items-center px-2 text-white">
      {/* Logo */}
      <a
        href={`/${locale}/dashboard`}
        className="flex h-full items-center gap-2 rounded px-2 hover:bg-white/5"
      >
        <Image
          src="/globe/logo.png"
          alt="Console"
          width={120}
          height={28}
          priority
          className="h-7 w-auto object-contain"
        />
      </a>

      {/* Services dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex h-full items-center gap-1.5 px-3 text-[13px] font-semibold hover:bg-white/5">
            {t("topNavServices")}
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[200px]">
          <DropdownMenuItem onClick={() => handleNavigate("/dashboard")}>
            <LayoutDashboard className="h-4 w-4" />
            <span>{t("topNavServicesOverview")}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleNavigate("/dashboard/activities")}
          >
            <Activity className="h-4 w-4" />
            <span>{t("topNavServicesActivities")}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Search */}
      <div
        ref={searchWrapperRef}
        className="relative mx-3 max-w-2xl flex-[4]"
        onBlur={(e) => {
          if (!searchWrapperRef.current?.contains(e.relatedTarget as Node)) {
            setSearchOpen(false);
          }
        }}
      >
        <div className="flex h-7 items-center rounded bg-white">
          <Search className="text-aws-text3 ms-2.5 h-4 w-4" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            placeholder={t("topNavSearchPlaceholder")}
            className="text-aws-text flex-1 bg-transparent px-2.5 text-[13px] outline-none"
          />
          <span className="me-2 flex items-center gap-1">
            <kbd className="bg-aws-bg2 border-aws-border text-aws-text2 num rounded border px-1.5 py-0.5 text-[11px]">
              Alt
            </kbd>
            <kbd className="bg-aws-bg2 border-aws-border text-aws-text2 num rounded border px-1.5 py-0.5 text-[11px]">
              S
            </kbd>
          </span>
        </div>

        {searchOpen && (
          <div className="border-aws-border2 absolute start-0 end-0 top-[calc(100%+4px)] max-h-80 overflow-y-auto rounded-md border bg-white py-1 shadow-lg">
            {matches.length === 0 ? (
              <div className="text-aws-text2 px-3 py-2 text-[13px]">
                {t("topNavSearchEmpty")}
              </div>
            ) : (
              matches.map(({ labelKey, href, icon: Icon }) => (
                <button
                  key={`${labelKey}-${href}`}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelectPage(href)}
                  className="text-aws-text hover:bg-aws-bg2 flex w-full items-center gap-2 px-3 py-1.5 text-start text-[13px]"
                >
                  <Icon className="text-aws-text2 h-4 w-4" />
                  <span>{t(labelKey as any)}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Right cluster */}
      <div className="flex h-full flex-1 items-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="flex h-full items-center px-2.5 text-[13px] hover:bg-white/5">
              <CircleHelp className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            {t("topNavHelpTooltip")}
          </TooltipContent>
        </Tooltip>

        <button className="flex h-full items-center gap-1.5 border-s border-white/10 px-3 text-[13px] hover:bg-white/5">
          <span>{t("topNavRegionCity")}</span>
          <ChevronDown className="h-3.5 w-3.5" />
        </button>

        {/* Spacer — empty space between region and user info */}
        <div className="flex-1" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-full items-center gap-2 border-s border-white/10 px-3 text-[13px] hover:bg-white/5"
            >
              <div className="bg-aws-orange num grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold">
                {initials}
              </div>
              <div className="text-start leading-tight">
                <div className="font-semibold">{displayName}</div>
                {roleLabel ? (
                  <div className="text-[11px] text-white/60">{roleLabel}</div>
                ) : (
                  user?.email && (
                    <div className="num text-[11px] text-white/60">
                      {user.email}
                    </div>
                  )
                )}
              </div>
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-45">
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              <span>{t("topNavLogout")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <FontSwitcher />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={t("topNavLanguageAria" as any) ?? "Language"}
              className="flex h-full items-center gap-2 border-s border-white/10 px-3 text-[13px] font-semibold hover:bg-white/5"
            >
              <Image
                src="/icons/lang.png"
                alt=""
                width={16}
                height={16}
                className="h-4 w-4 brightness-0 invert"
              />
              <span>{locale === "ar" ? "العربية" : "English"}</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-70" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[200px]">
            <DropdownMenuItem
              onClick={() => handleSelectLocale("ar")}
              className="flex items-center gap-2"
            >
              <span className="num bg-brand-light/40 inline-flex h-6 w-8 items-center justify-center rounded text-[10.5px] font-bold tracking-wider">
                AR
              </span>
              <span className="flex-1">العربية</span>
              {locale === "ar" && (
                <Check className="text-brand-green h-4 w-4" />
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleSelectLocale("en")}
              className="flex items-center gap-2"
            >
              <span className="num bg-brand-light/40 inline-flex h-6 w-8 items-center justify-center rounded text-[10.5px] font-bold tracking-wider">
                EN
              </span>
              <span className="flex-1">English</span>
              {locale === "en" && (
                <Check className="text-brand-green h-4 w-4" />
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
