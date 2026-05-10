/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { BaseDialog } from "../base";
import { FieldMetaFromTypes } from "./use-view-data";
import types from "./viewer-types";

interface ViewDialogProps<T extends Record<string, any>> {
  data: T | null;
  meta: FieldMetaFromTypes<T>[];
  defaultGridSize?: string;
  className?: string;
  baseDialogProps: Omit<React.ComponentProps<typeof BaseDialog>, "children">;
  closeText?: string;
}

export default function ViewDialog<T extends Record<string, any>>({
  data,
  meta,
  defaultGridSize = "col-span-1",
  className = "",
  baseDialogProps,
  // closeText,
}: ViewDialogProps<T>) {
  // تجهيز الحقول مع القيم
  const preparedFields = (_data: T) => {
    return meta
      .filter((field) => !field.hidden)
      .map((field) => {
        const value = field.valueGetter
          ? field.valueGetter(_data)
          : field.key
            ? _data[field.key]
            : undefined;

        return {
          ...field,
          value,
          gridSize: field.gridSize || defaultGridSize,
        };
      });
  };

  return (
    <BaseDialog {...baseDialogProps}>
      {baseDialogProps.isOpen && data && (
        <div className={`grid grid-cols-12 gap-4 p-4 pt-0 ${className}`}>
          {preparedFields(data).map((field: any, idx) => {
            const Component = types[field.type as keyof typeof types];
            if (!Component) return null;

            return (
              <div key={idx} className={field.gridSize}>
                <Component
                  label={field.label}
                  value={field.value}
                  {...field.extraProps}
                />
              </div>
            );
          })}
        </div>
      )}
    </BaseDialog>
  );
}
