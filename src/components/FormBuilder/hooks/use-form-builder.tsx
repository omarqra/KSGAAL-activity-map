"use client";

import { useMemo } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { UseFormProps, useForm } from "react-hook-form";
import z from "zod";

import { ExtractZodInfer, FormFields } from "../types/all-fields";
import { CheckIfFunction, GetRefinementType } from "../types/helpers";

const useFormBuilder = <
  T extends FormFields,
  Refinement = GetRefinementType<T>,
>(
  fields: T,
  options?: Omit<
    UseFormProps<{ [K in keyof ExtractZodInfer<T>]: ExtractZodInfer<T>[K] }>,
    "resolver"
  >,
  zodRefines?: CheckIfFunction<Refinement, "Both">
) => {
  type ZodRefine = CheckIfFunction<Refinement, "Single">;
  type ZodRefines = CheckIfFunction<Refinement, "Array">;

  const schema = useMemo(() => {
    let initialSchema = z.object({
      ...Object.entries(fields).reduce((acc, [name, field]) => {
        if (field.zod) {
          return {
            ...acc,
            [name]: field.zod,
          };
        } else {
          return acc;
        }
      }, {}),
    });
    if (zodRefines) {
      if (Array.isArray(zodRefines)) {
        for (const refine of zodRefines as unknown as ZodRefines) {
          initialSchema = initialSchema.superRefine(refine);
        }
      } else {
        initialSchema = initialSchema.superRefine(zodRefines as ZodRefine);
      }
    }
    return initialSchema;
  }, [fields, zodRefines]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resolver: any = useMemo(() => zodResolver(schema), [schema]);

  const formHooks = useForm({
    resolver,
    ...options,
  });

  return formHooks;
};

export default useFormBuilder;
