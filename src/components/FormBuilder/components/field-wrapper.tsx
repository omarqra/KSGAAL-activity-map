import { cn } from "@/lib/utils";

function FieldWrapper({
  children,
  disabled,
  hidden,
  defaultClassName = cn(
    "col-span-12 p-2",
    { "cursor-not-allowed opacity-50": disabled },
    { hidden: hidden }
  ),
  containerClassName,
}: {
  defaultClassName?: string;
  containerClassName?: string;
  disabled?: boolean;
  hidden?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn(defaultClassName, containerClassName)}>
      {hidden ? null : children}
    </div>
  );
}

export default FieldWrapper;
