"use client";

import { useId } from "react";

import { Controller } from "react-hook-form";

import { Checkbox, CheckboxProps } from "src/components/ui/checkbox";

import FieldError from "../components/field-error";
import FieldLabel from "../components/field-label";
import FieldWrapper from "../components/field-wrapper";
import { BaseFieldComponentProps } from "../types/all-fields";

export type CheckboxFieldProps = BaseFieldComponentProps & {
  onChange?: (checked: boolean) => void;
  checkboxProps?: Omit<CheckboxProps, "checked" | "onChange" | "name">;
};

const CheckboxField = ({
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
  disabled = false,
  hidden = false,
  checkboxProps,
}: CheckboxFieldProps) => {
  const id = useId();

  return (
    <Controller
      key={name}
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <FieldWrapper
          disabled={disabled}
          hidden={hidden}
          defaultClassName={"items-top col-span-12 flex w-full gap-2 space-x-2"}
          containerClassName={containerClassName}
        >
          <Checkbox
            id={id}
            checked={field.value}
            onCheckedChange={(checked) => {
              field.onChange(checked);
              if (onChange) onChange(!!checked);
            }}
            {...checkboxProps}
          />
          <div className="grid leading-none">
            <FieldLabel
              LabelComponent={LabelComponent}
              label={label}
              htmlFor={id}
              labelClassName={labelClassName}
              required={required}
            />
            <FieldError
              ErrorComponent={ErrorComponent}
              error={error}
              errorClassName={errorClassName}
            />
          </div>
        </FieldWrapper>
      )}
    />
  );
};

export default CheckboxField;
