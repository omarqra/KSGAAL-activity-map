"use client";

import { useId, useRef, useState } from "react";

import { CountryCode } from "libphonenumber-js";
import { useTranslations } from "next-intl";
import { Controller } from "react-hook-form";
import flags from "react-phone-number-input/flags";

import FieldError from "@/components/FormBuilder/components/field-error";
import FieldLabel from "@/components/FormBuilder/components/field-label";
import FieldWrapper from "@/components/FormBuilder/components/field-wrapper";
import { BaseFieldComponentProps } from "@/components/FormBuilder/types/all-fields";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

import localeToCountry from "./locale-to-country";

export type MultiLanguageFieldValue = Record<string, string>;

export type MultiLanguageOption = {
  code: string;
  label?: string;
  default?: boolean;
  icon?: React.ReactNode;
};

export type MultiLanguageFieldProps = BaseFieldComponentProps & {
  //?? رح ناخد افتراضي كل الغات بحسب مكتبة اللغة
  // languages?: Array<string | MultiLanguageOption>;
  defaultLanguage?: string;
  emptyLabel?: string;
  onChange?: (value: MultiLanguageFieldValue) => void;
  inputProps?: Omit<React.ComponentProps<"input">, "value" | "onChange">;
};

const normalizeLanguages = () => {
  return routing.locales.map((locale) => {
    const CountryFlag = flags[localeToCountry[locale] as CountryCode];
    return {
      default: locale === "en",
      code: locale,
      label: locale.toUpperCase(),
      icon: CountryFlag ? (
        <span
          className="inline-flex size-5 shrink-0 items-center justify-center pb-1 [&_svg]:size-full [&_svg]:object-contain"
          aria-hidden
        >
          <CountryFlag title={locale.toUpperCase()} />
        </span>
      ) : null,
    };
  });
};

const MultiLanguageField = ({
  name,
  control,
  label,
  required = false,
  containerClassName,
  errorClassName,
  labelClassName,
  LabelComponent,
  ErrorComponent,
  disabled = false,
  hidden = false,
  defaultLanguage = "en",
  emptyLabel = "Empty",
  onChange,
  inputProps,
}: MultiLanguageFieldProps) => {
  const id = useId();

  const t = useTranslations();

  const inputRef = useRef<HTMLInputElement | null>(null);

  const languageOptions = normalizeLanguages();

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState(defaultLanguage);

  if (hidden) return null;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        const valueMap =
          field.value && typeof field.value === "object" ? field.value : {};
        const currentValue = valueMap?.[activeLanguage] ?? "";
        const activeOption =
          languageOptions?.find((option) => option.code === activeLanguage) ||
          languageOptions?.find((option) => option.code === "en");

        return (
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
            <div className="flex items-center gap-2">
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    disabled={disabled}
                    className={cn(
                      "border-input text-foreground flex h-9 items-center gap-1.5 rounded-md border bg-transparent px-2.5 text-sm font-medium shadow-xs transition-colors outline-none",
                      "hover:bg-muted/50 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                    )}
                    aria-expanded={popoverOpen}
                    aria-haspopup="listbox"
                  >
                    {activeOption?.icon ? (
                      <span className="size-4 shrink-0">
                        {activeOption.icon}
                      </span>
                    ) : null}
                    <span className="uppercase">
                      {activeOption?.label || activeLanguage}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  side="bottom"
                  align="start"
                  sideOffset={4}
                  className="w-64 p-2"
                >
                  <div className="flex flex-col gap-2">
                    {languageOptions.map((option) => {
                      const textValue = valueMap?.[option.code];
                      const isEmpty =
                        !textValue || textValue.trim().length === 0;

                      return (
                        <button
                          key={option.code}
                          type="button"
                          className={cn(
                            "flex items-center justify-between gap-3 rounded-md border px-2 py-2 text-xs transition",
                            option.code === activeLanguage
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-background hover:bg-muted",
                            {
                              "border-destructive":
                                error &&
                                Object.keys(error).includes(option.code),
                            }
                          )}
                          onClick={() => {
                            setActiveLanguage(option.code);
                            setPopoverOpen(false);
                            window.requestAnimationFrame(() => {
                              inputRef.current?.focus();
                            });
                          }}
                        >
                          <span className="flex items-center gap-2 font-semibold uppercase">
                            {option.icon ? (
                              <span className="pt-1 text-sm">
                                {option.icon}
                              </span>
                            ) : null}
                            <span>{option.label || option.code}</span>
                            <span className="text-xs">
                              {option.default && (
                                <Badge className="text-xs">
                                  {t("Default")}
                                </Badge>
                              )}
                            </span>
                          </span>
                          <span className="text-muted-foreground">
                            {isEmpty ? emptyLabel : textValue}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
              <Input
                {...inputProps}
                id={id}
                ref={(element) => {
                  field.ref(element);
                  inputRef.current = element;
                }}
                placeholder={inputProps?.placeholder || ""}
                value={currentValue}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  const nextMap = {
                    ...valueMap,
                    [activeLanguage]: nextValue,
                  };
                  field.onChange(nextMap);
                  onChange?.(nextMap);
                }}
                onBlur={field.onBlur}
                disabled={disabled}
                aria-invalid={!!error}
                className={cn("flex-1", inputProps?.className)}
              />
            </div>
            <FieldError
              //!!wanna fix this
              error={
                error && {
                  type: "required",
                  message: t("This field is required"),
                }
              }
              errorClassName={errorClassName}
              ErrorComponent={ErrorComponent}
            />
          </FieldWrapper>
        );
      }}
    />
  );
};

export default MultiLanguageField;
