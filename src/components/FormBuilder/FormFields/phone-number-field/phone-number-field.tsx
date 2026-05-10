"use client";

import { useId } from "react";

import { Controller } from "react-hook-form";

import { cn } from "src/lib/utils";

import FieldError from "../../components/field-error";
import FieldLabel from "../../components/field-label";
import FieldWrapper from "../../components/field-wrapper";
import { BaseFieldComponentProps } from "../../types/all-fields";
import { PhoneInput, PhoneInputProps } from "./phone-input";

interface PhoneNumberInputFieldProps
  extends Omit<BaseFieldComponentProps, "type"> {
  inputClassName?: string;
  phoneInputProps?: PhoneInputProps;
  onChange?: (value: string) => void;
  variant?: InputVariant;
  size?: InputSize;
  placeholder?: string;
}

const PhoneNumberInputField = ({
  name,
  control,
  label,
  required = false,
  containerClassName,
  inputClassName,
  labelClassName,
  ErrorComponent,
  LabelComponent,
  phoneInputProps,
  errorClassName,
  onChange,
  variant = "outline",
  size = "md",
  hidden = false,
  disabled = false,
  placeholder,
}: PhoneNumberInputFieldProps) => {
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
            htmlFor={id}
            label={label}
            required={required}
            labelClassName={labelClassName}
            LabelComponent={LabelComponent}
          />
          <PhoneInput
            {...phoneInputProps}
            id={id}
            className={cn(
              "dir-ltr border-input bg-background w-full rounded-lg border!",
              variantStyles[variant],
              sizeStyles[size],
              { "border-red-500 focus:ring-red-500": !!error },
              inputClassName
            )}
            value={field.value}
            onChange={(value) => {
              field.onChange(value);
              if (onChange) onChange(value);
            }}
            placeholder={placeholder || "أدخل رقم الهاتف"}
            disabled={disabled}
          />
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

type InputVariant =
  | "default"
  | "outline"
  | "ghost"
  | "transparent"
  | "under_line";
type InputSize = "sm" | "md" | "lg";

// استيراد الأنماط من InputField الأصلي
const variantStyles: Record<InputVariant, string> = {
  default:
    "border border-gray-200 hover:bg-accent  bg-input dark:border-gray-700",
  outline: "border-2 border-gray-300 bg-transparent text-black dark:text-white",
  ghost: "border-none bg-gray-100",
  transparent: "border-none bg-transparent",
  under_line: "rounded-none bg-transparent border-b-[1px] border-primary",
};

const sizeStyles: Record<InputSize, string> = {
  sm: "px-2 py-0.5 text-sm",
  md: "px-3 py-0.5 text-base",
  lg: "px-4 py-0.5 text-lg",
};

export default PhoneNumberInputField;

export type { PhoneNumberInputFieldProps };
