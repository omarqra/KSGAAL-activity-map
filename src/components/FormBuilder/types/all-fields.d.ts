/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  FieldError,
  UseFieldArrayReturn,
  UseFormReturn,
} from "react-hook-form";
import z from "zod";

import { AutocompleteFieldProps } from "../FormFields/autocomplete-field";
import { AutocompleteFieldOneTimeFetchProps } from "../FormFields/autocomplete-field-one-time-fetch";
import { AutocompleteFieldServerProps } from "../FormFields/autocomplete-server-field";
import { AutocompleteFieldWithActionsProps } from "../FormFields/autocomplete-with-actions";
import { CheckboxFieldProps } from "../FormFields/checkbox-field";
import { CountryCodeAutocompleteFieldProps } from "../FormFields/countries-fields/country-code-autocomplete-field";
import { DateFieldProps } from "../FormFields/datetime/date-field";
import { FileUploadFieldProps } from "../FormFields/file-upload-field";
import { GoogleMapPickerProps } from "../FormFields/google-map-picker-field";
import { InputFieldProps } from "../FormFields/input-field";
import { MultiLanguageFieldProps } from "../FormFields/multi-language-field";
import { PhoneNumberInputFieldProps } from "../FormFields/phone-number-field/phone-number-field";
import { RadioFieldProps } from "../FormFields/radio-field";
import { SliderFieldProps } from "../FormFields/slider-field";
import { SwitchFieldProps } from "../FormFields/switch-field";

type BaseFieldComponentProps = {
  name: string;
  control: Control;
  label?: string;
  containerClassName?: string;
  errorClassName?: string;
  labelClassName?: string;
  required?: boolean;
  hidden?: boolean;
  disabled?: boolean;
  LabelComponent?: (props: { htmlFor: string | id }) => React.ReactNode;
  ErrorComponent?: (props: {
    error: FieldError | undefined;
  }) => React.ReactNode;
};

type BaseField = {
  zod?: z.ZodType;
  fieldsToWatch?: any[];
};

type ComponentPropsFunction<T, P> = ({
  WatchValues,
}: {
  WatchValues: T | Record<string, any>;
} & UseFormReturn<T | any>) => Omit<P, "control" | "name">;

type FieldConfig<T, P> = BaseField & {
  componentProps: Omit<P, "control" | "name"> | ComponentPropsFunction<T, P>;
};

type FieldArrayFunctionProps<T> = {
  WatchValues: Record<string, any>;
  fieldArrayHooks: UseFieldArrayReturn<T, string, "id">;
  FormHooks: UseFormReturn<T>;
  index: number;
  id: string;
};

type FieldArrayReturnType<T, TFields> = {
  type: "field-array";
  containerClassName?: string;
  errorClassName?: string;
  zod: z.ZodArray<z.ZodObject<ExtractZodSchema<TFields>, z.core.$strip>>;
  fields: (FormHooks?: FieldArrayFunctionProps<T>) => TFields;
};

type PrepareFieldArrayOptionsType<in TFields> = {
  refineZod: (
    schema: z.ZodArray<z.ZodObject<ExtractZodSchema<TFields>, z.core.$strip>>
  ) => z.ZodType;
  fieldsToWatch?: string[];
  containerClassName?: string;
  errorClassName?: string;
};

type FieldFnType<
  in FormHooks extends FieldArrayFunctionProps<any>,
  out Fields extends FormFields,
> = (FormHooks?: FormHooks) => Fields;

type PrepareFieldArrayType<T = any> = <TFields extends FormFields>(
  fields: FieldFnType<FieldArrayFunctionProps<T>, TFields>,
  options: PrepareFieldArrayOptionsType<TFields>
) => FieldArrayReturnType<T, TFields>;

type Field<T> =
  | (FieldConfig<T, InputFieldProps> & {
      type: "input";
    })
  | (FieldConfig<T, MultiLanguageFieldProps> & {
      type: "multi-language";
    })
  | (FieldConfig<T, PhoneNumberInputFieldProps> & {
      type: "phone-number";
    })
  | (FieldConfig<T, CheckboxFieldProps> & {
      type: "checkbox";
    })
  | (FieldConfig<T, SwitchFieldProps> & {
      type: "switch";
    })
  | (FieldConfig<T, DateFieldProps> & {
      type: "datetime-local";
    })
  | (FieldConfig<T, SliderFieldProps> & {
      type: "slider";
    })
  | (FieldConfig<T, RadioFieldProps> & {
      type: "radio";
    })
  | (FieldConfig<T, GoogleMapPickerProps> & {
      type: "google-map-picker";
    })
  | (FieldConfig<T, FileUploadFieldProps> & {
      type: "file-upload";
    })
  | (FieldConfig<T, AutocompleteFieldProps> & {
      type: "autocomplete";
    })
  | (FieldConfig<T, AutocompleteFieldServerProps> & {
      type: "autocomplete-server";
    })
  | (FieldConfig<T, AutocompleteFieldWithActionsProps> & {
      type: "autocomplete-with-actions";
    })
  | (FieldConfig<T, AutocompleteFieldOneTimeFetchProps> & {
      type: "autocomplete-one-time-fetch";
    })
  | (FieldConfig<T, CountryCodeAutocompleteFieldProps> & {
      type: "autocomplete-country";
    })
  | (FieldConfig<T, Parameters<K>[0]> & {
      type: "custom";
      component: K;
    })
  | (BaseField & {
      type: "field-array";
      containerClassName?: string;
      errorClassName?: string;
      fields: (props: FieldArrayFunctionProps<T>) => Record<string, Field<T>>;
    });

type FormFields = Record<string, Field<any>>;

type ExtractZodSchema<F> = {
  [N in keyof F as F[N]["zod"] extends z.ZodType ? N : never]: F[N]["zod"];
};

type ExtractZodInfer<F> = {
  [N in keyof F as F[N]["zod"] extends z.ZodType ? N : never]: z.infer<
    F[N]["zod"]
  >;
};

type PrepareFields = <TFields extends Record<string, Field<any>>>(
  fields: TFields
) => TFields;

type FormBuilderProps = <T extends Record<string, Field<any>>>(params: {
  fields: T;
  FormHooks: UseFormReturn<any>;
  containerClassName?: string;
  className?: string;
  enableDevTools?: boolean;
}) => JSX.Element;

type AllFieldsTypes = Field["type"];
