import { Messages } from "next-intl";

import PERMS from "@/configs/all-permissions";
import { usePathname } from "@/i18n/routing";

export type AllPaths = ReturnType<typeof usePathname>;
type filteredMessages = {
  [k in keyof Messages as Messages[k] extends string ? k : never]: Messages[k];
};
export type InsureTranslations = keyof filteredMessages;
export namespace DashboardLayout {
  interface Submenu {
    href: AllPaths;
    label: InsureTranslations;
    active?: boolean;
    hide?: boolean;
    icon?: string;
  }

  interface Menu {
    href: AllPaths;
    label: InsureTranslations;
    active?: boolean;
    hide?: boolean;
    icon: string;
    submenus?: Submenu[];
    actions: PERMS[];
  }

  interface Group {
    groupLabel: InsureTranslations;
    icon?: string;
    menus: Menu[];
    actions: PERMS[];
  }
}
