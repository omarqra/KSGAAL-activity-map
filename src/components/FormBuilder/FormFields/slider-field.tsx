"use client";

import { useId } from "react";

import { Controller } from "react-hook-form";

import { Slider, SliderProps } from "@/components/ui/slider";

import FieldError from "../components/field-error";
import FieldLabel from "../components/field-label";
import FieldWrapper from "../components/field-wrapper";
import { BaseFieldComponentProps } from "../types/all-fields";

export type SliderFieldProps = BaseFieldComponentProps & {
  onChange?: (value: number[]) => void;
  sliderProps?: Omit<SliderProps, "value" | "onValueChange">;
  defaultValue?: number[];
};

const SliderField = ({
  name,
  control,
  label,
  required = false,
  containerClassName,
  errorClassName,
  labelClassName,
  LabelComponent,
  ErrorComponent,
  onChange,
  sliderProps,
  defaultValue = [25, 75],
  disabled = false,
  hidden = false,
}: SliderFieldProps) => {
  const id = useId();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <FieldWrapper
          disabled={disabled}
          hidden={hidden}
          defaultClassName="col-span-12 h-full w-full space-y-2 px-2"
          containerClassName={containerClassName}
        >
          <div className="flex items-center justify-between gap-8">
            <FieldLabel
              LabelComponent={LabelComponent}
              label={label}
              htmlFor={id}
              labelClassName={labelClassName}
              required={required}
            />
            <p
              dir="ltr"
              className="bg-primary text-primary-foreground rounded-md px-2 pb-1 text-sm"
            >
              {(field.value || defaultValue).join(" - ")}
            </p>
          </div>
          <Slider
            id={id}
            value={field.value || defaultValue}
            disabled={disabled}
            onValueChange={(value) => {
              field.onChange(value);
              if (onChange) onChange(value);
            }}
            onBlur={field.onBlur}
            {...sliderProps}
          />
          <input ref={field.ref} className="absolute -z-50 h-0 w-0 opacity-0" />
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

export default SliderField;
