"use client";

import { Check, ChevronDown, Type } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type FontKey, useFontStore } from "@/store/font-store";

const OPTIONS: { value: FontKey; label: string }[] = [
  { value: "cairo", label: "Cairo" },
  { value: "majalla", label: "Sakkal Majalla" },
];

const labelFor = (key: FontKey) =>
  OPTIONS.find((o) => o.value === key)?.label ?? key;

export default function FontSwitcher() {
  const font = useFontStore((s) => s.font);
  const setFont = useFontStore((s) => s.setFont);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Change font"
          className="flex h-full items-center gap-2 border-s border-white/10 px-3 text-[13px] font-semibold hover:bg-white/5"
        >
          <Type className="h-4 w-4" />
          <span>{labelFor(font)}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-70" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[200px]">
        {OPTIONS.map(({ value, label }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => setFont(value)}
            className="flex items-center gap-2"
          >
            <Type className="text-aws-text2 h-4 w-4" />
            <span className="flex-1">{label}</span>
            {font === value && <Check className="text-brand-green h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
