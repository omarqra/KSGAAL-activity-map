import { createNavigation } from "next-intl/navigation";
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ["en", "ar"],
  // Used when no locale matches
  defaultLocale: "ar",
  localePrefix: "always",
  pathnames: {
    "/": {
      en: "/home",
      ar: "/المنزل",
    },
    "/account-settings": {
      ar: "/account-settings",
      en: "/account-settings",
    },
    "/settings/users": {
      en: "/settings/users",
      ar: "/settings/users",
    },
    "/settings/user-types": {
      en: "/settings/user-types",
      ar: "/أنواع المستخدمين",
    },
    "/dialog-example": {
      en: "/dialog-example",
      ar: "/مثال على الديلوج",
    },
    "/form-example": {
      en: "/form-example",
      ar: "/مثال على النموذج",
    },
    "/auth/login": {
      en: "/login",
      ar: "/تسجيل الدخول",
    },
    "/auth/otp": {
      en: "/auth/otp",
      ar: "/auth/otp",
    },
    "/too-many-requests": {
      en: "/too-many-requests",
      ar: "/عدد الطلبات المكثفة",
    },
    "/support": {
      en: "/support",
      ar: "/support",
    },
    "/monitoring": {
      en: "/monitoring",
      ar: "/monitoring",
    },
    "/monitoring/[id]": {
      en: "/monitoring/[id]",
      ar: "/monitoring/[id]",
    },
    "/monitoring/incidents": {
      en: "/monitoring/incidents",
      ar: "/monitoring/incidents",
    },
    "/monitoring/servers/[id]": {
      en: "/monitoring/servers/[id]",
      ar: "/monitoring/servers/[id]",
    },
    "/monitoring/settings": {
      en: "/monitoring/settings",
      ar: "/monitoring/settings",
    },
    "/monitoring/status-preview": {
      en: "/monitoring/status-preview",
      ar: "/monitoring/status-preview",
    },
    "/monitoring/automation": {
      en: "/monitoring/automation",
      ar: "/monitoring/automation",
    },
    "/monitoring/assistant": {
      en: "/monitoring/assistant",
      ar: "/monitoring/assistant",
    },
    "/globe": {
      en: "/globe",
      ar: "/globe",
    },
    "/admin": {
      en: "/admin",
      ar: "/admin",
    },
    "/admin/organizations": {
      en: "/admin/organizations",
      ar: "/admin/organizations",
    },
    "/admin/countries": {
      en: "/admin/countries",
      ar: "/admin/countries",
    },
    "/admin/activity-types": {
      en: "/admin/activity-types",
      ar: "/admin/activity-types",
    },
    "/admin/activity-subtypes": {
      en: "/admin/activity-subtypes",
      ar: "/admin/activity-subtypes",
    },
  },
});

export type LanguageCode = (typeof routing.locales)[number];

export const LOCALE_PREFIX = /^\/(ar|en)(?=\/|$)/;

// use typescript keyof instead of writing then two times
export type NotDynamicPathnames = Exclude<
  keyof typeof routing.pathnames,
  `[${string}]` | `/${string}/[${string}]`
>;

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export type Locale = (typeof routing.locales)[number];
export const {
  Link,
  redirect,
  usePathname,
  useRouter,
  getPathname,
  permanentRedirect,
} = createNavigation(routing);
export type LinkProps = Parameters<typeof Link>[0];
export type ValidHref = LinkProps["href"];
