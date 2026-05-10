/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from "zod";

import { PrepareFieldArrayType } from "../types/all-fields";

const prepareFieldArray: PrepareFieldArrayType = (fields, options) => {
  const _fields = fields();
  const entries = Object.entries(_fields);
  const zod = z.array(
    z.object(
      Object.fromEntries(
        entries
          .filter((field) => field[1].zod)
          .map(([key, field]) => [key, field.zod])
      )
    )
    // type script is not able to know the type here
  ) as any;

  const result = {
    type: "field-array" as const,
    zod: options.refineZod(zod) as any,
    containerClassName: options.containerClassName,
    errorClassName: options.errorClassName,
    fields,
  };
  return result;
};

export default prepareFieldArray;
