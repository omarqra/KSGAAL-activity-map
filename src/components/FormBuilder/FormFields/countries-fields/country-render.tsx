import { useMemo } from "react";

import { hasFlag } from "country-flag-icons";
import * as allFlags from "country-flag-icons/react/3x2";
import countries from "i18n-iso-countries";
import arLocale from "i18n-iso-countries/langs/ar.json";
import enLocale from "i18n-iso-countries/langs/en.json";
import nationalities from "i18n-nationality";
import enNationalityLocale from "i18n-nationality/langs/en.json";
import { CountryCode, getCountryCallingCode } from "libphonenumber-js";

import AutocompleteField from "../autocomplete-field";
import arNationalityLocale from "./ar.json";
import { CountryCodeAutocompleteFieldProps } from "./country-code-autocomplete-field";

// Register both English and Arabic locales
countries.registerLocale(enLocale);
countries.registerLocale(arLocale);
nationalities.registerLocale(enNationalityLocale);
nationalities.registerLocale(arNationalityLocale);

export default function CountryRender({
  getOptions,
  ...props
}: CountryCodeAutocompleteFieldProps) {
  const countriesData = useMemo(() => {
    // Get all country codes
    const countryCodes = countries.getAlpha2Codes();

    // Initialize an array to hold country data
    const countryData = [];

    // Iterate over each country code
    for (const alpha2Code in countryCodes) {
      // Get country names in both languages
      const countryNameEn = countries.getName(alpha2Code, "en");
      const countryNameAr = countries.getName(alpha2Code, "ar");

      // Get nationalities in both languages
      const nationalityEn = nationalities.getName(alpha2Code, "en");
      const nationalityAr = nationalities.getName(alpha2Code, "ar");

      // Get calling code with type assertion
      let callingCode;
      try {
        callingCode = getCountryCallingCode(
          alpha2Code.toUpperCase() as CountryCode
        );
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        callingCode = "N/A"; // Handle countries without a calling code
      }

      // Check if flag is available
      const flagAvailable = hasFlag(alpha2Code);

      // Construct country object
      const countryInfo = {
        nameEn: countryNameEn,
        nameAr: countryNameAr,
        alpha2Code: alpha2Code,
        alpha3Code: countries.alpha2ToAlpha3(alpha2Code),
        numericCode: countries.alpha2ToNumeric(alpha2Code),
        nationalityEn: (nationalityEn || countryNameEn) as string,
        nationalityAr: (nationalityAr ||
          countryNameAr ||
          nationalityEn ||
          countryNameEn) as string,
        callingCode: callingCode,
        flag: flagAvailable
          ? allFlags[alpha2Code as keyof typeof allFlags]
          : "N/A",
      };

      // Add to the array
      countryData.push(countryInfo);
    }

    // Format the data for autocomplete based on type
    return getOptions(countryData).filter((item) => item.value);
  }, [getOptions]);

  return (
    <AutocompleteField
      {...props}
      options={countriesData}
      loading={false}
      getOptionsError={false}
    />
  );
}
