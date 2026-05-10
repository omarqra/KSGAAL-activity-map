import { AllFieldsTypes } from "../types/all-fields";
import AutocompleteField from "./autocomplete-field";
import AutocompleteOneTimeFetchField from "./autocomplete-field-one-time-fetch";
import AutocompleteServerField from "./autocomplete-server-field";
import AutocompleteWithActionsField from "./autocomplete-with-actions";
import CheckboxField from "./checkbox-field";
import CountryCodeAutocompleteField from "./countries-fields/country-code-autocomplete-field";
import DateField from "./datetime/date-field";
import FileUploadField from "./file-upload-field";
import GoogleMapPicker from "./google-map-picker-field";
import InputField from "./input-field";
import MultiLanguageField from "./multi-language-field/multi-language-field";
import PhoneNumberInputField from "./phone-number-field/phone-number-field";
import RadioField from "./radio-field";
import SliderField from "./slider-field";
import SwitchField from "./switch-field";

const map: Record<
  Exclude<AllFieldsTypes, "field-array" | "custom">,
  unknown
> = {
  autocomplete: AutocompleteField,
  "autocomplete-one-time-fetch": AutocompleteOneTimeFetchField,
  "autocomplete-server": AutocompleteServerField,
  "autocomplete-with-actions": AutocompleteWithActionsField,
  checkbox: CheckboxField,
  "datetime-local": DateField,
  "google-map-picker": GoogleMapPicker,
  "file-upload": FileUploadField,
  input: InputField,
  "multi-language": MultiLanguageField,
  radio: RadioField,
  slider: SliderField,
  switch: SwitchField,
  "phone-number": PhoneNumberInputField,
  "autocomplete-country": CountryCodeAutocompleteField,
};

export default map;
