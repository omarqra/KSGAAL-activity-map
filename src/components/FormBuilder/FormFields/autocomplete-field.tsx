/* eslint-disable max-lines */
"use client";

import React, { useEffect, useId, useState } from "react";

import { Check, ChevronsUpDown, Loader2, RefreshCcw, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Controller } from "react-hook-form";

import { Button, ButtonProps } from "src/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "src/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "src/components/ui/popover";
import { cn } from "src/lib/utils";

import FieldError from "../components/field-error";
import FieldLabel from "../components/field-label";
import FieldWrapper from "../components/field-wrapper";
import { BaseFieldComponentProps } from "../types/all-fields";

type AutocompleteVariant =
  | "default"
  | "outline"
  | "ghost"
  | "transparent"
  | "under_line";
type AutocompleteSize = "sm" | "md" | "lg";

const variantStyles: Record<AutocompleteVariant, string> = {
  default:
    "border border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-1  focus:ring-primary/10 bg-input",
  outline:
    "border-[1px] rounded border-gray-300 bg-transparent hover:border-primary focus:border-ring focus:ring-ring/50 focus:ring-[3px] transition-all duration-300 ease-out ",
  ghost:
    "border-none bg-gray-50 hover:bg-gray-100 focus:bg-white focus:ring-2 focus:ring-blue-500/10 shadow-sm hover:shadow-md transition-all duration-300 ease-out",
  transparent:
    "border-none bg-transparent hover:bg-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all duration-300 ease-out",
  under_line: "rounded-none border-b-[1px] border-primary bg-transparent  ",
};

const sizeStyles: Record<AutocompleteSize, string> = {
  sm: "px-2 py-1 text-xs",
  md: "px-3 py-2 text-sm",
  lg: "px-4 py-3 text-lg",
};

export type AutocompleteOption = {
  value: string | number;
  label: string;
  /**
   * The key of the option to prevent duplicate value when mapping the options.
   * @default value
   */
  key?: string;
  filterKeys?: string[];
  group?: `${number}.${string}`;
  icon?: React.FunctionComponent;
};

export type AutocompleteFieldProps = BaseFieldComponentProps & {
  name: string;
  size?: AutocompleteSize;
  variant?: AutocompleteVariant;
  options: AutocompleteOption[];
  placeholder?: string;
  multiple?: boolean;
  onChange?: (option: AutocompleteOption | AutocompleteOption[]) => void;
  serverSearch?: (value: string) => void;
  onOpen?: (force?: boolean) => void;
  loading?: boolean;
  getOptionsError?: boolean;
  buttonProps?: Omit<ButtonProps, "onChange" | "value" | "variant">;
};

const AutocompleteField = ({
  name,
  control,
  LabelComponent,
  ErrorComponent,
  options: optionsDefaults,
  required = false,
  placeholder,
  label,
  containerClassName,
  labelClassName,
  errorClassName,
  onChange,
  variant = "outline",
  size = "md",
  hidden = false,
  disabled = false,
  serverSearch,
  loading = false,
  getOptionsError,
  onOpen,
  multiple = false,
  buttonProps = {},
}: AutocompleteFieldProps) => {
  const id = useId();
  const t = useTranslations();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (onOpen && open) {
      onOpen();
    }
  }, [onOpen, open]);

  const groups = React.useMemo(() => {
    // sort options by group and return groups as list of object { group: string, options: AutocompleteOption[] }
    return optionsDefaults.reduce(
      (acc, option) => {
        if (option.group) {
          const group = acc.find((group) => group.group === option.group);
          if (group) {
            group.options.push(option);
          } else {
            acc.push({ group: option.group, options: [option] });
          }
        }
        return acc;
      },
      [] as { group: string; options: AutocompleteOption[] }[]
    );
  }, [optionsDefaults]);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        if (multiple && !Array.isArray(field.value)) field.value = [];
        if (!multiple && Array.isArray(field.value)) field.value = undefined;
        // if (field.value && !optionsDefaults.length && oneTimeFetch)
        //   oneTimeFetch();
        // if (field.value && optionsDefaults.length)
        //   field.onChange(
        //     optionsDefaults.find((op) => op.value == field.value?.value) ||
        //       field.value
        //   );
        return (
          <FieldWrapper
            containerClassName={containerClassName}
            disabled={disabled}
            hidden={hidden}
          >
            <FieldLabel
              LabelComponent={LabelComponent}
              htmlFor={id}
              labelClassName={labelClassName}
              label={label}
              required={required}
            />

            <Popover open={open} onOpenChange={setOpen} modal>
              <PopoverTrigger asChild>
                <Button
                  variant={"ghost"}
                  role="combobox"
                  aria-expanded={open}
                  disabled={disabled}
                  {...buttonProps}
                  className={cn(
                    "flex h-fit w-full justify-between rounded-lg! transition-colors focus:outline-none",
                    sizeStyles[size] || sizeStyles.md,
                    {
                      "border-red-500! focus:ring-red-200!": !!error,
                    },
                    variantStyles[variant] || variantStyles.outline,
                    buttonProps.className,
                    ""
                  )}
                >
                  {(Array.isArray(field.value) && field.value.length ? (
                    <div className="flex flex-wrap gap-2">
                      {field.value.map(
                        (option: AutocompleteOption, idx: number) => {
                          return (
                            <div
                              key={`${String(option.value)}-${option.label}-${idx}`}
                              className="bg-primary text-primary-foreground flex items-center gap-3 rounded px-2 py-1"
                            >
                              {option?.label}
                              <span
                                className="ml-1 cursor-pointer"
                                role="button"
                                tabIndex={0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newSelectedValues = field.value.filter(
                                    (v: AutocompleteOption) =>
                                      v.value !== option.value
                                  );
                                  field.onChange(newSelectedValues);
                                  if (onChange) onChange(newSelectedValues);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const newSelectedValues =
                                      field.value.filter(
                                        (v: AutocompleteOption) =>
                                          v.value !== option.value
                                      );
                                    field.onChange(newSelectedValues);
                                    if (onChange) onChange(newSelectedValues);
                                  }
                                }}
                              >
                                <X />
                              </span>
                            </div>
                          );
                        }
                      )}
                    </div>
                  ) : (
                    field.value?.label
                  )) || t("Click to select option")}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command shouldFilter={!serverSearch}>
                  <CommandInput
                    onValueChange={(e) => {
                      serverSearch?.(e);
                    }}
                    placeholder={placeholder || t("Search options")}
                    ButtonAfter={
                      onOpen && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            onOpen(true);
                          }}
                        >
                          <RefreshCcw className="h-2 w-2" />
                        </Button>
                      )
                    }
                  />
                  <CommandList>
                    <CommandEmpty>{t("No results")}</CommandEmpty>
                    {loading && (
                      <CommandItem className="flex items-center justify-center">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </CommandItem>
                    )}
                    {!loading && getOptionsError && (
                      <CommandItem>
                        <p>{t("Error fetching options")}</p>
                        <Button
                          variant="outline"
                          onClick={() => {
                            serverSearch?.(field.value);
                            onOpen?.(true);
                          }}
                        >
                          {t("Retry")}
                        </Button>
                      </CommandItem>
                    )}
                    {!(loading || getOptionsError) &&
                      (groups.length ? (
                        groups.map((group) => (
                          <CommandGroup
                            key={group.group}
                            heading={group.group.split(".")[1]}
                          >
                            {group.options.map((option) => {
                              const isSelected = Array.isArray(field.value)
                                ? field.value.some(
                                    (v: AutocompleteOption) =>
                                      v.value === option.value
                                  )
                                : field.value?.value === option.value;
                              return (
                                <CommandItem
                                  key={option.key || option.value}
                                  value={`${option.value}:${option.label}`}
                                  keywords={option.filterKeys?.filter(Boolean)}
                                  onSelect={(currentValue) => {
                                    if (multiple) {
                                      const newSelectedValues = isSelected
                                        ? field.value.filter(
                                            (value: AutocompleteOption) =>
                                              value.value !== option.value
                                          )
                                        : [...field.value, option];
                                      field.onChange(newSelectedValues);
                                      if (onChange) onChange(newSelectedValues);
                                    } else {
                                      const [selectedValue] =
                                        currentValue.split(":");
                                      const value =
                                        selectedValue ===
                                        field.value?.value?.toString()
                                          ? { value: undefined }
                                          : option;
                                      field.onChange(value);
                                      if (onChange) onChange(option);
                                      setOpen(false);
                                    }
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      isSelected ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {option.icon && <option.icon />}
                                  {option.label}
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        ))
                      ) : (
                        <CommandGroup>
                          {optionsDefaults?.map((option) => {
                            const isSelected = Array.isArray(field.value)
                              ? field.value.some(
                                  (v: AutocompleteOption) =>
                                    v.value === option.value
                                )
                              : field.value?.value === option.value;
                            return (
                              <CommandItem
                                key={option.key || option.value}
                                value={`${option.value}:${option.label}`}
                                keywords={option.filterKeys?.filter(Boolean)}
                                onSelect={(currentValue) => {
                                  if (multiple) {
                                    const newSelectedValues = isSelected
                                      ? field.value.filter(
                                          (value: AutocompleteOption) =>
                                            value.value !== option.value
                                        )
                                      : [...field.value, option];
                                    field.onChange(newSelectedValues);
                                    if (onChange) onChange(newSelectedValues);
                                  } else {
                                    const [selectedValue] =
                                      currentValue.split(":");
                                    const value =
                                      selectedValue ===
                                      field.value?.value?.toString()
                                        ? { value: undefined }
                                        : option;
                                    field.onChange(value);
                                    if (onChange) onChange(option);
                                    setOpen(false);
                                  }
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    isSelected ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {option.icon && <option.icon />}
                                {option.label}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            <FieldError
              ErrorComponent={ErrorComponent}
              error={error}
              errorClassName={errorClassName}
            />
          </FieldWrapper>
        );
      }}
    />
  );
};

export default AutocompleteField;
