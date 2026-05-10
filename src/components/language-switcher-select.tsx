"use client";

import { useParams, useSearchParams } from "next/navigation";

import { SelectValue } from "@radix-ui/react-select";
import { LanguagesIcon } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Locale, routing, usePathname, useRouter } from "@/i18n/routing";

type Props = {
  defaultValue: string;
  label: string;
};

export default function LanguageSwitcherSelect({ defaultValue, label }: Props) {
  const router = useRouter();

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams();

  function onSelectChange(nextLocale: Locale) {
    let _pathname = pathname;
    const search = searchParams.entries().toArray();
    if (search.length)
      _pathname += `?${search.map((e) => `${e[0]}=${e[1]}`).join("&")}`;

    router.replace(
      // @ts-expect-error -- TypeScript will validate that only known `params`
      // are used in combination with a given `pathname`. Since the two will
      // always match for the current route, we can skip runtime checks.
      { pathname: _pathname, params },
      { locale: nextLocale }
    );
  }

  return (
    <Select defaultValue={defaultValue} onValueChange={onSelectChange}>
      <SelectTrigger
        className="hover:border-primary border-primary/30 text-primary [&>svg]:text-primary! flex h-10 items-center justify-center rounded-lg border shadow-none focus:border-none focus:ring-0"
        aria-label={label}
      >
        <SelectValue>
          <span className="flex items-center gap-2 font-medium">
            <LanguagesIcon className="text-primary size-4" />
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="border-primary/30 bg-primary/15 rounded-lg border shadow-lg backdrop-blur-md">
        {routing.locales.map((locale) => (
          <SelectItem
            key={locale}
            value={locale}
            className="bg-primary text-primary hover:bg-primary/50 [&>svg]:primary!"
          >
            <span className="font-medium transition-colors duration-200">
              {locale.toUpperCase() === "AR" ? "AR" : "EN"}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
