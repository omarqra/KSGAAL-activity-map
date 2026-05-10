import { cn } from "@/lib/utils";

export default function FieldLabel({
  LabelComponent,
  labelClassName,
  defaultClassName = "text-sm font-medium mb-1 block",
  label,
  htmlFor,
  required = false,
}: {
  LabelComponent?: (props: { htmlFor: string | number }) => React.ReactNode;
  labelClassName?: string;
  defaultClassName?: string;
  label: string | undefined;
  htmlFor: string;
  required?: boolean;
}) {
  if (LabelComponent) {
    return <LabelComponent htmlFor={htmlFor} />;
  }
  if (!label) return null;
  return (
    <label className={cn(defaultClassName, labelClassName)} htmlFor={htmlFor}>
      {label}
      {required && <span className="ml-1 text-red-500">{"*"}</span>}
    </label>
  );
}
