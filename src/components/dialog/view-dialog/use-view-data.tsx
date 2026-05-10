import { useBaseDialog } from "../base";
import types from "./viewer-types";

type TypesMap = typeof types;

export type FieldMetaFromTypes<T> = {
  [K in keyof TypesMap]: {
    key?: keyof T | (string & {});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    valueGetter?: (data: T) => any;
    label?: string;
    type: K;
    gridSize?: string;
    hidden?: boolean;
    extraProps?: Omit<React.ComponentProps<TypesMap[K]>, "value">;
  };
}[keyof TypesMap];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useDialogWithData<T extends Record<string, any>>(
  dialogName: string,
  data: T | null,
  meta: FieldMetaFromTypes<T>[],
  options?: {
    defaultGridSize?: string;
  }
) {
  const { isOpen, open, close, toggle } = useBaseDialog(dialogName);

  const preparedFields = meta
    .filter((field) => !field.hidden)
    .map((field) => {
      const value =
        field.valueGetter && data
          ? field.valueGetter(data)
          : field.key && data
            ? data[field.key]
            : undefined;

      return {
        ...field,
        value,
        gridSize: field.gridSize || options?.defaultGridSize || "col-span-12",
      };
    });

  return {
    isOpen,
    open,
    close,
    toggle,
    data,
    fields: preparedFields,
  };
}
