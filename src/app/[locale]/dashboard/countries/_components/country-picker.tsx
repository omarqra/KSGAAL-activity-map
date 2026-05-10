"use client";

import { useMemo, useState } from "react";

import { Check, ChevronDown } from "lucide-react";
import worldCountries from "world-countries";

import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type CountryRegion =
  | "gulf"
  | "levant"
  | "north_africa"
  | "africa"
  | "asia"
  | "europe"
  | "americas"
  | "other";

export interface PickedCountry {
  code: string;
  nameAr: string;
  nameEn: string;
  lat: number;
  lng: number;
  flag: string;
  region: CountryRegion;
}

const GCC_CODES = new Set(["sa", "ae", "qa", "kw", "bh", "om"]);
const LEVANT_CODES = new Set(["sy", "lb", "jo", "ps", "iq"]);

function deriveRegion(
  cca2: string,
  region: string,
  subregion: string
): CountryRegion {
  const cc = cca2.toLowerCase();
  if (GCC_CODES.has(cc)) return "gulf";
  if (LEVANT_CODES.has(cc)) return "levant";
  if (subregion === "Northern Africa") return "north_africa";
  if (region === "Africa") return "africa";
  if (region === "Asia") return "asia";
  if (region === "Europe") return "europe";
  if (region === "Americas") return "americas";
  return "other";
}

interface Props {
  value: string | null;
  onPick: (picked: PickedCountry) => void;
  invalid?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
}

/* Build the picker list once at module load. world-countries ships a static
   JSON of every ISO 3166-1 country with translations, centroid coordinates,
   and a flag emoji — exactly what we need to populate the form without
   asking the admin for a code or coordinates by hand. */
const COUNTRY_LIST: PickedCountry[] = worldCountries
  .map((c) => ({
    code: c.cca2.toLowerCase(),
    nameAr: c.translations?.ara?.common ?? c.name.common,
    nameEn: c.name.common,
    lat: c.latlng[0],
    lng: c.latlng[1],
    flag: c.flag,
    region: deriveRegion(c.cca2, c.region, c.subregion),
  }))
  .sort((a, b) => a.nameAr.localeCompare(b.nameAr, "ar"));

export function CountryPicker({
  value,
  onPick,
  invalid,
  placeholder,
  searchPlaceholder,
  emptyText,
}: Props) {
  const [open, setOpen] = useState(false);

  const current = useMemo(
    () =>
      value
        ? (COUNTRY_LIST.find((c) => c.code === value.toLowerCase()) ?? null)
        : null,
    [value]
  );

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-expanded={open}
          className={cn(
            "flex h-9 w-full items-center justify-between gap-2 rounded border bg-white px-3 text-[13px] outline-none",
            invalid
              ? "border-brand-wine focus:border-brand-wine"
              : "border-aws-border focus:border-aws-link"
          )}
          dir="rtl"
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="text-[16px] leading-none">
              {current ? current.flag : "🌐"}
            </span>
            <span
              className={cn(
                "truncate",
                current ? "text-aws-text" : "text-aws-text3"
              )}
            >
              {current ? current.nameAr : (placeholder ?? "اختر الدولة")}
            </span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="z-[70] w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        dir="rtl"
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder ?? "بحث..."} />
          <CommandList
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            <CommandEmpty>{emptyText ?? "لا نتائج"}</CommandEmpty>
            {COUNTRY_LIST.map((c) => (
              <CommandItem
                key={c.code}
                value={`${c.nameAr} ${c.nameEn} ${c.code}`}
                onSelect={() => {
                  onPick(c);
                  setOpen(false);
                }}
              >
                <span className="me-2 text-[16px] leading-none">{c.flag}</span>
                <span className="min-w-0 flex-1 text-start">
                  <span className="block truncate">{c.nameAr}</span>
                  <span className="text-aws-text3 num block truncate text-[11px]">
                    {c.nameEn} · {c.code.toUpperCase()}
                  </span>
                </span>
                {current?.code === c.code ? (
                  <Check className="text-brand-green-primary h-4 w-4" />
                ) : null}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
