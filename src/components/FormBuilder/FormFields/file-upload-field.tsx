"use client";

import Image from "next/image";
import { useMemo, useRef } from "react";

import { Upload, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Controller } from "react-hook-form";

import { ImageBaseUrl } from "@/configs/api";

import { cn } from "src/lib/utils";

import FieldError from "../components/field-error";
import FieldLabel from "../components/field-label";
import FieldWrapper from "../components/field-wrapper";
import { BaseFieldComponentProps } from "../types/all-fields";

export type FileUploadFieldProps = BaseFieldComponentProps & {
  onChange?: (value: File | File[] | null) => void;
  fileProps?: Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "type" | "onChange" | "multiple" | "accept"
  >;
  multiple?: boolean;
  accept?: string;
  ImageBaseUrl?: string;
};

const FileUploadField = ({
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
  fileProps,
  ImageBaseUrl: propImageBaseUrl = ImageBaseUrl,
  multiple = false,
  accept,
  disabled = false,
  hidden = false,
}: FileUploadFieldProps) => {
  const id = useMemo(() => `${name}-file-upload`, [name]);
  const t = useTranslations();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Controller
      name={name}
      control={control}
      render={({
        field: { onChange: fieldOnChange, value },
        fieldState: { error },
      }) => (
        <FieldWrapper
          disabled={disabled}
          hidden={hidden}
          defaultClassName="col-span-12 flex w-full flex-col gap-2"
          containerClassName={containerClassName}
        >
          <FieldLabel
            LabelComponent={LabelComponent}
            label={label}
            htmlFor={id}
            labelClassName={labelClassName}
            required={required}
          />

          <label
            htmlFor={id}
            className={cn(
              "border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground active:bg-accent/80 dark:bg-input/30 dark:border-input dark:hover:bg-input/50 flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium shadow-sm transition-all",
              {
                "cursor-not-allowed opacity-50": disabled,
              }
            )}
          >
            <Upload className="text-muted-foreground h-5 w-5" />
            <span>{multiple ? t("Upload files") : t("Upload file")}</span>
          </label>

          <input
            ref={inputRef}
            id={id}
            type="file"
            className="hidden"
            disabled={disabled}
            onChange={(e) => {
              const files = e.target.files;
              if (!files) return;

              const newValue: File | File[] = multiple
                ? Array.from(files)
                : files[0];

              fieldOnChange(newValue);
              if (onChange) onChange(newValue);
            }}
            accept={accept}
            multiple={multiple}
            {...fileProps}
          />

          {value && (
            <div className="grid grid-cols-3 gap-2">
              {(Array.isArray(value) ? value : [value]).map((img, index) => (
                <div
                  key={index}
                  className="relative h-[150px] w-full rounded-lg"
                >
                  <Image
                    key={index}
                    src={
                      img instanceof File || img instanceof Blob
                        ? URL.createObjectURL(img)
                        : `${propImageBaseUrl}${img}`
                    }
                    alt={`Uploaded Image ${index}`}
                    className="h-full w-full rounded-lg object-cover"
                    width={100}
                    height={100}
                  />
                  <button
                    type="button"
                    className="text-destructive hover:bg-destructive bg-background dark:bg-card dark:hover:bg-destructive absolute top-2 right-2 cursor-pointer rounded-full p-1 opacity-70 hover:text-white hover:opacity-100"
                    onClick={() => {
                      fieldOnChange(
                        multiple
                          ? Array.isArray(value)
                            ? value.filter((_, i) => i !== index)
                            : []
                          : null
                      );
                      if (onChange)
                        onChange(
                          multiple
                            ? Array.isArray(value)
                              ? value.filter((_, i) => i !== index)
                              : []
                            : null
                        );
                    }}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

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

export default FileUploadField;
