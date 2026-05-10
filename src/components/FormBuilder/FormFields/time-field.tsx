"use client";

import { InputHTMLAttributes, useId } from "react";

import { Controller } from "react-hook-form";

import { cn } from "src/lib/utils";

import FieldError from "../components/field-error";
import FieldLabel from "../components/field-label";
import FieldWrapper from "../components/field-wrapper";
import { BaseFieldComponentProps } from "../types/all-fields";

type TimeFieldProps = BaseFieldComponentProps & {
  type?: "time";
  placeholder?: string;
  inputClassName?: string;
  onChange?: (value: string | number) => void;
  variant?: "default" | "outline" | "ghost" | "transparent" | "under_line";
  size?: "sm" | "md" | "lg";
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
};

type InputVariant =
  | "default"
  | "outline"
  | "ghost"
  | "transparent"
  | "under_line";
type InputSize = "sm" | "md" | "lg";

const variantStyles: Record<InputVariant, string> = {
  default: "hover:bg-accent border border-input bg-background",
  outline: "border-2 border-gray-300 bg-transparent",
  ghost: "border-none bg-gray-100",
  transparent: "border-none bg-transparent",
  under_line: "rounded-none bg-transparent  border-b-[1px] border-primary",
};

const sizeStyles: Record<InputSize, string> = {
  sm: "px-2 py-1 text-sm",
  md: "px-3 py-2 text-base",
  lg: "px-4 py-3 text-lg",
};

const TimeField = ({
  name,
  control,
  label,
  required = false,
  type = "time",
  containerClassName,
  inputClassName,
  labelClassName,
  errorClassName,
  onChange,
  variant = "default",
  size = "md",
  hidden = false,
  disabled = false,
  inputProps = {},
  prefix,
  suffix,
  placeholder,
  ErrorComponent,
  LabelComponent,
}: TimeFieldProps) => {
  const id = useId();
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
            label={label}
            htmlFor={id}
            labelClassName={labelClassName}
            required={required}
          />
          <div className="relative flex items-center">
            {prefix && (
              <div className="absolute z-10 flex items-center ltr:left-3 rtl:right-3">
                {prefix}
              </div>
            )}
            <input
              id={id}
              type={type}
              className={cn(
                "w-full rounded-md transition-colors ltr:justify-items-start rtl:justify-items-end",
                sizeStyles[size],

                "focus:outline-none",
                {
                  "border-red-500 focus:ring-red-500": !!error,
                  "ltr:pl-10 rtl:pr-10": !!prefix,
                  "ltr:pr-10 rtl:pl-10": !!suffix,
                },
                variantStyles[variant],
                inputClassName
              )}
              placeholder={placeholder}
              {...field}
              onChange={(e) => {
                if (onChange) {
                  onChange(e.target.value);
                } else {
                  field.onChange(e);
                }
              }}
              value={field.value || ""}
              disabled={disabled}
              {...inputProps}
            />
            {suffix && (
              <div className="absolute z-10 flex items-center ltr:right-3 rtl:right-auto rtl:left-3">
                {suffix}
              </div>
            )}
          </div>
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

export default TimeField;
