import type { FieldError } from "react-hook-form";

import { cn } from "@/lib/utils";

export default function FieldError({
  ErrorComponent,
  error,
  errorClassName,
  defaultClassName = "text-sm text-red-500 mt-2",
}: {
  ErrorComponent?: (props: { error: FieldError }) => React.ReactNode;
  error?: FieldError;
  errorClassName?: string;
  defaultClassName?: string;
}) {
  if (!error) return null;
  if (ErrorComponent) {
    return <ErrorComponent error={error} />;
  }
  return (
    <p className={cn(defaultClassName, errorClassName)}>{error.message}</p>
  );
}
