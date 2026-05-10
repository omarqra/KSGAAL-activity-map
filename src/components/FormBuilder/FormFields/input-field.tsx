"use client";

import { useId } from "react";

import { Controller } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import FieldError from "../components/field-error";
import FieldLabel from "../components/field-label";
import FieldWrapper from "../components/field-wrapper";
import { BaseFieldComponentProps } from "../types/all-fields";

export type InputFieldProps = BaseFieldComponentProps & {
  onChange?: (value: string | number) => void;
  type: InputTypeAttribute;
  inputProps?: Omit<React.ComponentProps<"input">, "type">;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
};

export type InputTypeAttribute =
  | "color"
  | "date"
  | "email"
  | "textarea"
  | "hidden"
  | "month"
  | "number"
  | "password"
  | "search"
  | "tel"
  | "text"
  | "time"
  | "url"
  | "week";

const InputField = ({
  name,
  type,
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
  inputProps,
  prefix,
  suffix,
}: InputFieldProps) => {
  const id = useId();

  if (hidden) return null;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <FieldWrapper
          disabled={disabled}
          hidden={hidden}
          containerClassName={containerClassName}
        >
          <FieldLabel
            LabelComponent={LabelComponent}
            htmlFor={id}
            labelClassName={labelClassName}
            label={label}
            required={required}
          />
          <div className="relative flex items-center">
            {prefix && (
              <div className="absolute flex items-center ltr:left-3 rtl:right-3">
                {prefix}
              </div>
            )}
            <Input
              {...inputProps}
              id={id}
              ref={field.ref}
              type={type || "text"}
              placeholder={inputProps?.placeholder || ""}
              value={field.value ?? ""}
              onChange={(e) => {
                const value =
                  type === "number" ? Number(e.target.value) : e.target.value;
                field.onChange(value);
                onChange?.(value);
              }}
              onBlur={field.onBlur}
              disabled={disabled}
              aria-invalid={!!error}
              className={cn(
                prefix && "ltr:pl-10! rtl:pr-10!",
                suffix && "ltr:pr-10! rtl:pl-10!",
                "border-muted dark:border-white",
                inputProps?.className
              )}
            />
            {suffix && (
              <div className="absolute flex items-center ltr:right-3 rtl:left-3">
                {suffix}
              </div>
            )}
          </div>
          <FieldError
            error={error}
            errorClassName={errorClassName}
            ErrorComponent={ErrorComponent}
          />
        </FieldWrapper>
      )}
    />
  );
};

export default InputField;
