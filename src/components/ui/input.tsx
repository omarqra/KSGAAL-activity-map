import * as React from "react";

import { cn } from "@/lib/utils";

type InputProps = React.ComponentProps<"input"> & {
  type?: React.HTMLInputTypeAttribute | "textarea";
};

function Input({ className, type, ...props }: InputProps) {
  const commonClasses = cn(
    "border-input placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 w-full min-w-0 rounded-md border bg-transparent px-3 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
    "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
    "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
    className
  );

  if (type === "textarea") {
    return (
      <textarea
        data-slot="input"
        className={cn("min-h-24 py-2", commonClasses)}
        {...(props as React.ComponentProps<"textarea">)}
      />
    );
  }

  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground h-9 py-1 file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        commonClasses
      )}
      {...props}
    />
  );
}

export { Input };
