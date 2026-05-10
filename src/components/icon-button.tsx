import { type VariantProps, cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const iconButtonVariants = cva("rounded-full focus:outline", {
  variants: {
    variant: {
      outline: "border",
      filled: "border-none",
      ghost: "border-none bg-transparent",
    },
    color: {
      primary: "border-primary",
      secondary: "border-secondary",
      muted: "border-muted",
      accent: "border-accent",
      destructive: "border-destructive",
    },
    size: {
      sm: "p-1 text-xs",
      md: "p-2 text-xs",
      lg: "p-3 text-sm",
    },
  },
  defaultVariants: {
    variant: "outline",
    color: "primary",
    size: "md",
  },
  compoundVariants: [
    {
      variant: "filled",
      color: "primary",
      className:
        "bg-primary text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground focus:outline-primary/80 focus:ring-primary/80",
    },
    {
      variant: "filled",
      color: "secondary",
      className:
        "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:text-secondary-foreground focus:outline-secondary/80 focus:ring-secondary/80",
    },
    {
      variant: "filled",
      color: "muted",
      className:
        "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-muted-foreground focus:outline-muted/80 focus:ring-muted/80",
    },
    {
      variant: "filled",
      color: "accent",
      className:
        "bg-accent text-accent-foreground hover:bg-accent/80 hover:text-accent-foreground focus:outline-accent/80 focus:ring-accent/80",
    },
    {
      variant: "filled",
      color: "destructive",
      className:
        "bg-destructive  text-white hover:bg-destructive/80 hover:text-white focus:outline-destructive/80 focus:ring-destructive/80",
    },
    {
      variant: "ghost",
      color: "primary",
      className:
        "bg-transparent text-primary hover:bg-primary hover:text-primary-foreground focus:outline-primary focus:ring-primary",
    },
    {
      variant: "ghost",
      color: "secondary",
      className:
        "bg-transparent text-secondary hover:bg-secondary hover:text-secondary-foreground focus:outline-secondary focus:ring-secondary",
    },
    {
      variant: "ghost",
      color: "muted",
      className:
        "bg-transparent text-muted hover:bg-muted hover:text-muted-foreground focus:outline-muted focus:ring-muted",
    },
    {
      variant: "ghost",
      color: "accent",
      className:
        "bg-transparent text-accent hover:bg-accent hover:text-accent-foreground focus:outline-accent focus:ring-accent",
    },
    {
      variant: "ghost",
      color: "destructive",
      className:
        "bg-transparent text-destructive hover:bg-destructive hover:text-white! focus:outline-destructive focus:ring-destructive",
    },
    {
      variant: "outline",
      color: "primary",
      className:
        "bg-transparent text-primary hover:bg-primary/80 hover:text-primary-foreground focus:outline-primary-foreground focus:ring-primary-foreground",
    },
    {
      variant: "outline",
      color: "secondary",
      className:
        "bg-transparent text-secondary hover:bg-secondary/80 hover:text-secondary-foreground focus:outline-secondary-foreground focus:ring-secondary-foreground",
    },
    {
      variant: "outline",
      color: "muted",
      className:
        "bg-transparent text-muted hover:bg-muted/80 hover:text-muted-foreground focus:outline-muted-foreground focus:ring-muted-foreground",
    },
    {
      variant: "outline",
      color: "accent",
      className:
        "bg-transparent text-accent hover:bg-accent/80 hover:text-accent-foreground focus:outline-accent-foreground focus:ring-accent-foreground",
    },
    {
      variant: "outline",
      color: "destructive",
      className:
        "bg-transparent text-destructive hover:bg-destructive/80 hover:text-white focus:outline-destructive-foreground focus:ring-destructive-foreground",
    },
  ],
});

export interface IconButtonProps
  extends Omit<
      React.ButtonHTMLAttributes<HTMLButtonElement>,
      "size" | "color" | "variant"
    >,
    VariantProps<typeof iconButtonVariants> {
  children: React.ReactNode;
}

export default function IconButton({
  children,
  className,
  variant,
  color,
  size,
  ...props
}: IconButtonProps) {
  return (
    <button
      className={cn(iconButtonVariants({ variant, color, size }), className)}
      {...props}
    >
      {children}
    </button>
  );
}
