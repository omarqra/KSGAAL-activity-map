/* eslint-disable @typescript-eslint/no-explicit-any */
import z from "zod";

import { ExtractZodInfer } from "./all-fields";

type CheckIfFunction<T, Style = "Both" | "Single" | "Array"> = T extends (
  ...args: any[]
) => any
  ? Style extends "Both"
    ? Parameters<T>[0] | Parameters<T>[0][]
    : Style extends "Single"
      ? Parameters<T>[0]
      : Style extends "Array"
        ? Parameters<T>[0][]
        : never
  : never;

type GetRowRefinementType<T> = z.ZodType<{
  [K in keyof ExtractZodInfer<T>]: ExtractZodInfer<T>[K];
}>["superRefine"];

type GetRefinementType<T> =
  GetRowRefinementType<T> extends (...args: any[]) => any
    ? GetRowRefinementType<T>
    : never;
