"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";

import { Save, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import {
  LocationPicker,
  type LatLng,
} from "@/components/dashboard/location-picker";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { resolveApiErrorMessage } from "@/lib/api-error";

import type { Country } from "../_lib/api";
import {
  CountryPicker,
  type CountryRegion,
  type PickedCountry,
} from "./country-picker";

const COUNTRY_REGIONS: readonly CountryRegion[] = [
  "gulf",
  "levant",
  "north_africa",
  "africa",
  "asia",
  "europe",
  "americas",
  "other",
];

const REGION_LABEL_KEY: Record<CountryRegion, string> = {
  gulf: "regionGulf",
  levant: "regionLevant",
  north_africa: "regionNorthAfrica",
  africa: "regionAfrica",
  asia: "regionAsia",
  europe: "regionEurope",
  americas: "regionAmericas",
  other: "regionOther",
};

interface ApiEnvelope<T> {
  data: T | null;
  error: { message: string; code?: string; details?: unknown } | null;
}

interface FormState {
  code: string;
  nameAr: string;
  nameEn: string;
  region: CountryRegion | "";
}

const EMPTY_FORM: FormState = {
  code: "",
  nameAr: "",
  nameEn: "",
  region: "",
};

const FALLBACK_CENTER: LatLng = { lat: 24.72169, lng: 46.75702 };
const FALLBACK_ZOOM = 3;

function countryToForm(c: Country): FormState {
  const region = (COUNTRY_REGIONS as readonly string[]).includes(c.region)
    ? (c.region as CountryRegion)
    : "";
  return {
    code: (c.code ?? "").toLowerCase(),
    nameAr: c.nameAr,
    nameEn: c.nameEn ?? c.nameAr,
    region,
  };
}

function countryToLocation(c: Country): LatLng | null {
  if (c.lat == null || c.lng == null) return null;
  return { lat: c.lat, lng: c.lng };
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Country | null;
  onSuccess?: () => void;
}

export function CountryFormSheet({
  open,
  onOpenChange,
  initial,
  onSuccess,
}: Props) {
  const t = useTranslations("CountriesPage");
  const tErr = useTranslations("ApiErrors");
  const router = useRouter();
  const isEdit = !!initial;

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [location, setLocation] = useState<LatLng | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof FormState | "location", string>>
  >({});

  useEffect(() => {
    if (!open) return;
    setForm(initial ? countryToForm(initial) : EMPTY_FORM);
    setLocation(initial ? countryToLocation(initial) : null);
    setSubmitError(null);
    setFieldErrors({});
  }, [open, initial]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) setSubmitting(false);
      onOpenChange(next);
    },
    [onOpenChange]
  );

  const update = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setFieldErrors((prev) => {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    []
  );

  const validate = (): {
    ok: boolean;
    errors: Partial<Record<keyof FormState | "location", string>>;
  } => {
    const errors: Partial<Record<keyof FormState | "location", string>> = {};
    if (!form.code.trim() || !form.nameAr.trim()) {
      errors.code = t("formErrorCode");
    }
    if (!location) errors.location = t("formErrorLocation");
    return { ok: Object.keys(errors).length === 0, errors };
  };

  const handlePickCountry = useCallback((picked: PickedCountry) => {
    setForm((prev) => ({
      ...prev,
      code: picked.code,
      nameAr: picked.nameAr,
      nameEn: picked.nameEn,
      region: picked.region,
    }));
    setLocation({ lat: picked.lat, lng: picked.lng });
    setFieldErrors((prev) => {
      if (!prev.code && !prev.nameAr && !prev.location) return prev;
      const next = { ...prev };
      delete next.code;
      delete next.nameAr;
      delete next.location;
      return next;
    });
  }, []);

  const handleLocationChange = useCallback((next: LatLng | null) => {
    setLocation(next);
    setFieldErrors((prev) => {
      if (!prev.location) return prev;
      const cleared = { ...prev };
      delete cleared.location;
      return cleared;
    });
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const { ok: valid, errors } = validate();
    setFieldErrors(errors);
    if (!valid) {
      setSubmitError(t("formErrorReview"));
      return;
    }

    const nameAr = form.nameAr.trim();
    const nameEn = (form.nameEn || nameAr).trim();
    const code = form.code.trim().toLowerCase();
    const payload: Record<string, unknown> = isEdit
      ? {
          code,
          nameAr,
          nameEn,
          lat: location!.lat,
          lng: location!.lng,
        }
      : {
          code,
          nameAr,
          nameEn,
          short: nameAr,
          lat: location!.lat,
          lng: location!.lng,
        };
    if (form.region) payload.region = form.region;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const url = isEdit
        ? `/api/admin/countries/${initial!.id}`
        : "/api/admin/countries";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as ApiEnvelope<unknown>;
      if (!res.ok || json.error) {
        throw new Error(
          resolveApiErrorMessage(
            (k) => tErr(k as never),
            json.error?.code,
            json.error?.message,
            isEdit ? t("formErrorGenericUpdate") : t("formErrorGenericCreate")
          )
        );
      }
      handleOpenChange(false);
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } catch (err) {
      setSubmitError(
        err instanceof Error && err.message
          ? err.message
          : isEdit
            ? t("formErrorGenericUpdate")
            : t("formErrorGenericCreate")
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="left"
        dir="rtl"
        className="!max-w-[480px] gap-0 bg-white p-0 sm:!max-w-[480px]"
      >
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <header className="border-aws-border2 border-b px-5 pt-5 pb-4">
            <SheetTitle className="text-aws-text text-[18px] leading-snug font-bold">
              {isEdit ? t("formTitleEdit") : t("formTitleCreate")}
            </SheetTitle>
            <p className="text-aws-text2 mt-1 text-[12px] leading-relaxed">
              {isEdit ? t("formDescriptionEdit") : t("formDescriptionCreate")}
            </p>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
            <Field
              label={t("formFieldNameAr")}
              required
              error={fieldErrors.code ?? fieldErrors.nameAr}
            >
              <CountryPicker
                value={form.code || null}
                onPick={handlePickCountry}
                invalid={!!(fieldErrors.code ?? fieldErrors.nameAr)}
              />
            </Field>

            <Field label={t("formFieldRegion")}>
              <select
                value={form.region}
                onChange={(e) =>
                  update("region", e.target.value as CountryRegion | "")
                }
                className={inputCls(false)}
                dir="rtl"
              >
                <option value="">—</option>
                {COUNTRY_REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {t(REGION_LABEL_KEY[r] as any)}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label={t("formFieldLocation")}
              required
              hint={t("formFieldLocationHint")}
              error={fieldErrors.location}
            >
              <LocationPicker
                value={location}
                onChange={handleLocationChange}
                defaultCenter={FALLBACK_CENTER}
                defaultZoom={FALLBACK_ZOOM}
                hostZoom={5}
                flyToValueKey={form.code || null}
                labels={{
                  empty: t("formLocationEmpty"),
                  clear: t("formLocationClear"),
                }}
              />
            </Field>

            {submitError && <Banner>{submitError}</Banner>}
          </div>

          <footer className="border-aws-border2 flex items-center justify-end gap-2 border-t bg-white px-5 py-3">
            <Button
              type="button"
              variant="default"
              icon={<X className="h-3.5 w-3.5" />}
              onClick={() => handleOpenChange(false)}
              disabled={submitting}
            >
              {t("formActionCancel")}
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={<Save className="h-3.5 w-3.5" />}
              disabled={submitting}
            >
              {submitting
                ? t("formSaving")
                : isEdit
                  ? t("formActionUpdate")
                  : t("formActionCreate")}
            </Button>
          </footer>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function inputCls(hasError: boolean): string {
  return [
    "h-9 w-full rounded border bg-white px-3 text-[13px] outline-none",
    hasError
      ? "border-brand-wine focus:border-brand-wine"
      : "border-aws-border focus:border-aws-link",
  ].join(" ");
}

function Banner({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-brand-wine/20 bg-brand-wine/5 text-brand-wine rounded border px-3 py-2 text-[12px]">
      {children}
    </div>
  );
}

interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}

function Field({ label, required, hint, error, children }: FieldProps) {
  return (
    <label className="block">
      <div className="text-aws-text mb-1 flex items-center gap-1 text-[13px] font-semibold">
        <span>{label}</span>
        {required && <span className="text-brand-wine">*</span>}
      </div>
      {children}
      {error ? (
        <div className="text-brand-wine mt-1 text-[11px]">{error}</div>
      ) : hint ? (
        <div className="text-aws-text3 num mt-1 text-[11px]">{hint}</div>
      ) : null}
    </label>
  );
}
