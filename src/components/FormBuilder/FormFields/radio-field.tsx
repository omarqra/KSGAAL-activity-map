"use client";

import { useId } from "react";

import { useLocale } from "next-intl";
import { Controller } from "react-hook-form";

import { Label } from "src/components/ui/label";
import {
  RadioGroup,
  RadioGroupItem,
  RadioGroupProps,
} from "src/components/ui/radio-group";
import { cn } from "src/lib/utils";

import FieldError from "../components/field-error";
import FieldLabel from "../components/field-label";
import FieldWrapper from "../components/field-wrapper";
import { BaseFieldComponentProps } from "../types/all-fields";
import { AutocompleteOption } from "./autocomplete-field";

export type RadioFieldProps = BaseFieldComponentProps & {
  options: AutocompleteOption[];
  onChange?: (value: string) => void;
  radioProps?: Omit<
    RadioGroupProps,
    "value" | "onValueChange" | "defaultValue"
  >;
  OptionsClassName?: string;
  OptionsLabelClassName?: string;
  RadioGroupClassName?: string;
  title?: string;
  subTitle?: string;
};

const RadioField = ({
  name,
  label,
  control,
  options,
  required = false,
  containerClassName,
  errorClassName,
  labelClassName,
  LabelComponent,
  ErrorComponent,
  OptionsClassName,
  OptionsLabelClassName,
  RadioGroupClassName,
  onChange,
  radioProps,
  disabled = false,
  hidden = false,
}: RadioFieldProps) => {
  const id = useId();
  const locale = useLocale();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <FieldWrapper
          disabled={disabled}
          hidden={hidden}
          defaultClassName="col-span-12 space-y-2"
          containerClassName={containerClassName}
        >
          <FieldLabel
            LabelComponent={LabelComponent}
            label={label}
            htmlFor={id}
            labelClassName={labelClassName}
            required={required}
          />

          <RadioGroup
            dir={locale === "ar" ? "rtl" : "ltr"}
            value={field.value}
            onValueChange={(value) => {
              field.onChange(value);
              if (onChange) onChange(value);
            }}
            onBlur={field.onBlur}
            ref={field.ref}
            className={cn("flex", RadioGroupClassName)}
            {...radioProps}
          >
            {options.map((option) => (
              <div
                key={option.value}
                className={cn(
                  "flex items-center justify-center",
                  OptionsClassName
                )}
              >
                <RadioGroupItem
                  className="mx-1 bg-white"
                  value={
                    typeof option.value === "number"
                      ? option.value.toString()
                      : option.value
                  }
                  id={`${id}-${option.value}`}
                />
                <Label
                  className={cn("text-base", OptionsLabelClassName)}
                  htmlFor={`${id}-${option.value}`}
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>

          <FieldError
            ErrorComponent={ErrorComponent}
            error={error}
            errorClassName={errorClassName}
          />
        </FieldWrapper>
      )}
    />
  );
};

export default RadioField;
