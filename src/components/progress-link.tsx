"use client";

import { Link, LinkProps } from "@/i18n/routing";
import { startProgress } from "@/lib/progress";
import { cn } from "@/lib/utils";

export default function ProgressLink(
  props: LinkProps & { disabled?: boolean }
) {
  return (
    <Link
      {...props}
      onNavigate={() => {
        startProgress();
      }}
      {...(props.disabled
        ? {
            className: cn(props.className, "pointer-events-none"),
          }
        : {})}
    />
  );
}
