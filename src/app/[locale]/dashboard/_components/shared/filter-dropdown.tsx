import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";

interface Props {
  label: string;
}

export function FilterDropdown({ label }: Props) {
  return (
    <Button
      variant="default"
      size="lg"
      iconRight={<ChevronDown className="h-3 w-3" />}
    >
      {label}
    </Button>
  );
}
