import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from "react";

import { cn } from "@/lib/utils";

type Variant = "primary" | "default" | "link" | "ghost" | "outline";
type Size = "default" | "md" | "sm" | "lg" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  iconRight?: ReactNode;
}

const variantClass: Record<Variant, string> = {
  primary: "btn btn-primary",
  default: "btn btn-default",
  link: "btn-link",
  ghost: "btn",
  outline: "btn border rounded-md",
};

const sizeClass: Record<Size, string> = {
  default: "h-9 px-3.5 text-[13px]",
  md: "",
  icon: "w-3 h-3",
  sm: "h-7 px-2.5 text-[12px]",
  lg: "h-9 px-3.5 text-[13px]",
};

export function buttonVariants(opts?: {
  variant?: Variant;
  size?: Size;
  className?: string;
}) {
  const v = opts?.variant ?? "default";
  const s = opts?.size ?? "md";
  return cn(variantClass[v], sizeClass[s], "rounded-md", opts?.className);
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "default",
      size = "md",
      icon,
      iconRight,
      className,
      children,
      ...rest
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          variantClass[variant],
          sizeClass[size],
          "rounded-md",
          className
        )}
        {...rest}
      >
        {icon}
        {children}
        {iconRight}
      </button>
    );
  }
);
Button.displayName = "Button";
