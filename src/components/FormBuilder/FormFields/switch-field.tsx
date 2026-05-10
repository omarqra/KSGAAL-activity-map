"use client";

import { useId } from "react";

import { Controller } from "react-hook-form";

import { Switch, SwitchProps } from "@/components/ui/switch";

import FieldError from "../components/field-error";
import FieldLabel from "../components/field-label";
import FieldWrapper from "../components/field-wrapper";
import { BaseFieldComponentProps } from "../types/all-fields";

type SwitchFieldProps = BaseFieldComponentProps & {
  onChange?: (checked: boolean) => void;
  switchProps?: Omit<SwitchProps, "checked" | "onChange" | "name">;
};

const SwitchField = ({
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
  switchProps,
  disabled = false,
  hidden = false,
}: SwitchFieldProps) => {
  const id = useId();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <FieldWrapper
          disabled={disabled}
          hidden={hidden}
          defaultClassName={"items-top col-span-12 flex w-full gap-2 space-x-2"}
          containerClassName={containerClassName}
        >
          <Switch
            id={id}
            ref={field.ref}
            checked={field.value}
            onBlur={field.onBlur}
            onCheckedChange={(checked) => {
              field.onChange(checked);
              if (onChange) onChange(!!checked);
            }}
            {...switchProps}
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

export default SwitchField;
