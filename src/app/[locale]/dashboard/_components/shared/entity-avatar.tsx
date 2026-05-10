import { cn } from "@/lib/utils";

interface Props {
  label: string;
  color: string;
  className?: string;
}

export function EntityAvatar({ label, color, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex h-7 min-w-7 items-center justify-center rounded px-1.5 text-[11px] font-bold text-white",
        className
      )}
      style={{ background: color }}
    >
      {label}
    </span>
  );
}
