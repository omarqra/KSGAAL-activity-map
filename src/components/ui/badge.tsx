import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

type Variant = "success" | "warn" | "error" | "outline" | "info" | "neutral" | "secondary";

interface BadgeProps {
  variant?: Variant;
  dot?: boolean;
  className?: string;
  children: ReactNode;
}

const variantClass: Record<Variant, string> = {
  success: "badge-success",
  warn: "badge-warn",
  error: "badge-error",
  info: "badge-info",
  neutral: "badge-neutral",
  secondary: "badge-neutral",
  outline: "",
};

const dotColor: Record<Variant, string> = {
  success: "#037F0C",
  warn: "#8D6708",
  error: "#D13212",
  info: "#0972D3",
  neutral: "#5F6B7A",
  secondary: "#5F6B7A",
  outline: "",
};

export function Badge({
  variant = "neutral",
  dot = false,
  className,
  children,
}: BadgeProps) {
  return (
    <span className={cn("badge", variantClass[variant], className)}>
      {dot && (
        <span
          className="status-dot"
          style={{ background: dotColor[variant] }}
        />
      )}
      {children}
    </span>
  );
}
