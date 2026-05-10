"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useTransition } from "react";

export type UrlStateValue = string | number;

export type UrlStateDefaults<TState extends Record<string, UrlStateValue>> = {
  [K in keyof TState]: TState[K];
};

export interface UseResourceUrlStateConfig<
  TState extends Record<string, UrlStateValue>,
> {
  defaults: UrlStateDefaults<TState>;
  numericKeys?: ReadonlyArray<keyof TState>;
}

export interface UseResourceUrlStateResult<
  TState extends Record<string, UrlStateValue>,
> {
  state: TState;
  setParams: (patch: Partial<TState>) => void;
  isPending: boolean;
}

export function useResourceUrlState<
  TState extends Record<string, UrlStateValue>,
>(
  config: UseResourceUrlStateConfig<TState>
): UseResourceUrlStateResult<TState> {
  const { defaults, numericKeys } = config;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const numericSet = useMemo(
    () => new Set<string>((numericKeys ?? []).map((k) => String(k))),
    [numericKeys]
  );

  const keys = useMemo(
    () => Object.keys(defaults) as Array<keyof TState>,
    [defaults]
  );

  const state = useMemo(() => {
    const out = {} as TState;
    for (const key of keys) {
      const k = String(key);
      const raw = searchParams.get(k);
      const fallback = defaults[key];
      if (numericSet.has(k)) {
        const n = Number(raw ?? fallback);
        out[key] = (
          Number.isFinite(n) && n > 0 ? Math.floor(n) : (fallback as number)
        ) as TState[typeof key];
      } else {
        out[key] = (raw ?? fallback) as TState[typeof key];
      }
    }
    return out;
  }, [keys, searchParams, defaults, numericSet]);

  const setParams = useCallback(
    (patch: Partial<TState>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const key of Object.keys(patch) as Array<keyof TState>) {
        const value = patch[key];
        const k = String(key);
        const isDefault =
          value === undefined ||
          value === null ||
          value === "" ||
          value === defaults[key];
        if (isDefault) {
          next.delete(k);
        } else {
          next.set(k, String(value));
        }
      }
      const qs = next.toString();
      startTransition(() => {
        router.replace(qs ? (`${pathname}?${qs}` as any) : pathname, {
          scroll: false,
        });
      });
    },
    [pathname, router, searchParams, defaults]
  );

  return { state, setParams, isPending };
}

