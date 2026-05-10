/* eslint-disable @typescript-eslint/no-explicit-any */
import { Fragment, useMemo } from "react";

import { DevTool } from "@hookform/devtools";
import { useLocale } from "next-intl";
import {
  FieldValues,
  Path,
  UseFormReturn,
  useFieldArray,
  useWatch,
} from "react-hook-form";
import z from "zod";

import { cn } from "src/lib/utils";

import map from "./FormFields";
import { AllFieldsTypes, Field, FormBuilderProps } from "./types/all-fields";

const FormBuilder: FormBuilderProps = ({
  fields,
  FormHooks,
  containerClassName,
  className,
  enableDevTools = false,
}) => {
  const locale = useLocale();
  z.config(z.locales[locale]());
  const formContainerClassName = useMemo(
    () => cn("grid w-full grid-cols-12 gap-3", containerClassName, className),
    [className, containerClassName]
  );
  return (
    <div className={formContainerClassName}>
      {Object.entries(fields).map(([key, field]) => (
        <FieldsRenderer
          key={key}
          FieldName={key}
          fieldsToWatch={field.fieldsToWatch ? field.fieldsToWatch : []}
          field={field}
          FormHooks={FormHooks}
          formContainerClassName={formContainerClassName}
        />
      ))}
      {enableDevTools && <DevTool control={FormHooks.control} />}
    </div>
  );
};

type FieldRenderProps<
  T extends Record<string, Field<any>>,
  G extends "Field" | "Field Array" | "Mixed",
> = {
  FormHooks: UseFormReturn<T>;
  fieldsToWatch: string[];
  formContainerClassName: string;
  field: G extends "Mixed"
    ? Field<T>
    : G extends "Field Array"
      ? { type: "field-array" } & Field<T>
      : { type: Exclude<AllFieldsTypes, "field-array"> } & Field<T>;
  FieldName: string;
};

function FieldsRenderer<T extends Record<string, Field<T>>>({
  FieldName,
  FormHooks,
  field,
  formContainerClassName,
}: FieldRenderProps<T, "Mixed">) {
  if (field.type === "field-array") {
    return (
      <FieldArrayHelper
        FormHooks={FormHooks}
        fieldsToWatch={field.fieldsToWatch ? field.fieldsToWatch : []}
        fieldArrayContainerClassName={field.containerClassName}
        field={field}
        FieldName={FieldName}
        formContainerClassName={formContainerClassName}
      />
    );
  } else {
    return (
      <WatchHelper
        FormHooks={FormHooks}
        fieldsToWatch={field.fieldsToWatch ? field.fieldsToWatch : []}
        field={field}
        FieldName={FieldName}
      />
    );
  }
}

function WatchHelper<T extends FieldValues>({
  FormHooks,
  fieldsToWatch = [],
  field,
  FieldName,
}: {
  FormHooks: UseFormReturn<T>;
  fieldsToWatch: Path<T>[];
  field: Field<T>;
  FieldName: string;
}) {
  const WatchValues = useWatch({
    control: FormHooks.control,
    disabled: !fieldsToWatch.length,
    name: fieldsToWatch,
  });
  const WatchValuesObject = useMemo(() => {
    const _ob: Record<string, unknown> = {};
    fieldsToWatch.forEach((field, index) => {
      _ob[field] = WatchValues[index];
    });
    return _ob;
  }, [fieldsToWatch, WatchValues]);
  if (field.type === "field-array") return "";
  const Component = field.type === "custom" ? field.component : map[field.type];
  return (
    <Component
      name={FieldName}
      control={FormHooks.control}
      {...(typeof field.componentProps === "function"
        ? field.componentProps({
            ...FormHooks,
            WatchValues: WatchValuesObject,
          } as any)
        : field.componentProps)}
    />
  );
}

function FieldArrayHelper<T extends FieldValues>({
  FormHooks,
  fieldsToWatch = [],
  field,
  FieldName,
  formContainerClassName,
  fieldArrayContainerClassName,
}: {
  FormHooks: UseFormReturn<T>;
  fieldsToWatch: Path<T>[];
  field: Field<T> & { type: "field-array" };
  FieldName: string;
  formContainerClassName: string;
  fieldArrayContainerClassName?: string;
}) {
  const {
    formState: { errors },
  } = FormHooks;
  const fieldError: any = errors[FieldName]?.root;

  const WatchValues = useWatch({
    control: FormHooks.control,
    disabled: !fieldsToWatch.length,
    name: fieldsToWatch,
  });
  const fieldArrayHooks = useFieldArray({
    control: FormHooks.control,
    // @ts-expect-error - FieldName is a string
    name: FieldName,
  });

  return (
    <Fragment key={`${FieldName}-field-array`}>
      {fieldArrayHooks.fields.map((ArrayField, index) => {
        const _fields = field.fields({
          FormHooks,
          WatchValues,
          fieldArrayHooks,
          index,
          id: ArrayField.id,
        });
        return (
          <div
            key={`${FieldName}.${ArrayField.id}`}
            className={cn(
              formContainerClassName,
              "col-span-12",
              fieldArrayContainerClassName
            )}
          >
            {Object.entries(_fields).map(([key, field]) => (
              <FieldsRenderer
                FieldName={`${FieldName}.${index}.${key}`}
                FormHooks={FormHooks}
                field={field}
                fieldsToWatch={field.fieldsToWatch ? field.fieldsToWatch : []}
                formContainerClassName={formContainerClassName}
                key={`${FieldName}.${index}.${key}.${ArrayField.id}`}
              />
            ))}
          </div>
        );
      })}
      {fieldError && (
        <span
          className={cn(
            "col-span-12 text-sm text-red-500",
            field.errorClassName
          )}
        >
          {fieldError.message instanceof String ? fieldError.message : ""}
        </span>
      )}
    </Fragment>
  );
}

export default FormBuilder;
