"use client";

import * as React from "react";
import { useId } from "react";

import { format } from "date-fns";
import { arSA, enUS } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useLocale } from "next-intl";
import {
  Controller,
  ControllerRenderProps,
  FieldError,
  FieldValues,
} from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Calendar, CalendarProps } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import FieldErrorComponent from "../../components/field-error";
import FieldLabel from "../../components/field-label";
import FieldWrapper from "../../components/field-wrapper";
import { BaseFieldComponentProps } from "../../types/all-fields";

export type DateFieldProps = BaseFieldComponentProps & {
  placeholder?: string;
  onChange?: (value: Date | undefined) => void;
  calendarProps?: Omit<CalendarProps, "selected" | "onSelect" | "mode">;
};

function isValidDate(date: Date | undefined) {
  if (!date) {
    return false;
  }
  return !isNaN(date.getTime());
}

function parseDate(
  value: Date | string | number | undefined | null
): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return isValidDate(parsed) ? parsed : undefined;
}

const DateFieldInner = ({
  field,
  error,
  id,
  label,
  required = false,
  placeholder = "Select a date",
  containerClassName,
  errorClassName,
  labelClassName,
  LabelComponent,
  ErrorComponent,
  onChange,
  disabled = false,
  hidden = false,
  calendarProps,
}: Omit<DateFieldProps, "control" | "name"> & {
  field: ControllerRenderProps<FieldValues, string>;
  error: FieldError | undefined;
  id: string;
}) => {
  const locale = useLocale();
  function formatDate(date: Date | undefined) {
    if (!date) {
      return "";
    }

    return isValidDate(date) ? format(date, "yyyy/MM/dd HH:mm") : "";
  }
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = [
    parseDate(field.value),
    (value: Date | undefined) => {
      const fixedValue = parseDate(value);
      field.onChange(fixedValue);
      if (onChange) onChange(fixedValue);
    },
  ];

  const debounce = React.useRef<NodeJS.Timeout>(null);
  const [month, setMonth] = React.useState<Date | undefined>(date);
  const [value, setValue] = React.useState(formatDate(date));

  const onDateSelect = (date: Date | undefined) => {
    if (date) date = new Date(`${format(date, "yyyy-MM-dd")}T12:00:00.000Z`);
    setDate(date);
    setValue(formatDate(date));
  };

  React.useEffect(() => {
    setValue(formatDate(date));
  }, [date]);

  return (
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
      <div className="relative flex gap-2">
        <Input
          id="date"
          value={value}
          placeholder={placeholder || formatDate(new Date())}
          className="bg-background ltr:pl-10 rtl:pr-10"
          disabled={disabled}
          onBlur={() => {
            setValue(formatDate(date));
          }}
          onChange={(e) => {
            const date = new Date(e.target.value);
            setValue(e.target.value);
            if (debounce.current) clearTimeout(debounce.current);
            const timeout = setTimeout(() => {
              if (isValidDate(date)) {
                setDate(date);
                setMonth(date);
              } else if (e.target.value === "") {
                setDate(undefined);
                setMonth(undefined);
              }
            }, 500);
            debounce.current = timeout;
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
            }
          }}
        />
        <Popover modal open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className={`absolute top-1/2 size-6 -translate-y-1/2 ltr:left-2 rtl:right-2`}
              disabled={disabled}
            >
              <CalendarIcon className="size-3.5" />
              <span className="sr-only">Select date</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="flex w-auto gap-2 overflow-hidden p-0"
            align="end"
            alignOffset={-8}
            sideOffset={10}
          >
            <Calendar
              mode="single"
              locale={locale === "ar" ? arSA : enUS}
              selected={date}
              onDayBlur={field.onBlur}
              month={month}
              onMonthChange={setMonth}
              onSelect={onDateSelect}
              {...calendarProps}
              captionLayout="dropdown"
            />
          </PopoverContent>
        </Popover>
      </div>
      <FieldErrorComponent
        ErrorComponent={ErrorComponent}
        error={error}
        errorClassName={errorClassName}
      />
    </FieldWrapper>
  );
};

const DateField = ({
  name,
  control,
  label,
  required = false,
  placeholder = "Select a date",
  containerClassName,
  errorClassName,
  labelClassName,
  LabelComponent,
  ErrorComponent,
  onChange,
  disabled = false,
  hidden = false,
  calendarProps,
}: DateFieldProps) => {
  const id = useId();

  return (
    <Controller
      name={name}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      defaultValue={new Date("2025-06-01") as any}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <DateFieldInner
          field={field}
          error={error}
          id={id}
          label={label}
          required={required}
          placeholder={placeholder}
          containerClassName={containerClassName}
          errorClassName={errorClassName}
          labelClassName={labelClassName}
          LabelComponent={LabelComponent}
          ErrorComponent={ErrorComponent}
          onChange={onChange}
          disabled={disabled}
          hidden={hidden}
          calendarProps={calendarProps}
        />
      )}
    />
  );
};

export default DateField;
