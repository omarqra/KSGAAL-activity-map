import dynamic from "next/dynamic";

import { FlagComponent } from "country-flag-icons/react/3x2";

import { Skeleton } from "@/components/ui/skeleton";

import {
  AutocompleteFieldProps,
  AutocompleteOption,
} from "../autocomplete-field";

export type CountryCodeAutocompleteFieldProps = {
  getOptions: (
    country: {
      nameEn: string | undefined;
      nameAr: string | undefined;
      alpha2Code: string;
      alpha3Code: string | undefined;
      numericCode: string | undefined;
      nationalityEn: string;
      nationalityAr: string;
      callingCode: string;
      flag: string | FlagComponent;
    }[]
  ) => AutocompleteOption[];
} & Omit<
  AutocompleteFieldProps,
  "options" | "serverSearch" | "loading" | "getOptionsError" | "type"
>;

export default function CountryCodeAutocompleteField(
  props: CountryCodeAutocompleteFieldProps
) {
  const CountryData = dynamic(() => import("./country-render"), {
    ssr: false,
    loading: () => (
      <div
        className={props.containerClassName}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          padding: "8px",
        }}
      >
        <Skeleton className="h-10 w-full" />
      </div>
    ),
  });
  return <CountryData {...props} />;
}
