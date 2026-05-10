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

import type { Organization } from "../_lib/api";

interface ApiEnvelope<T> {
  data: T | null;
  error: { message: string; code?: string; details?: unknown } | null;
}

type OrgStatus = "active" | "pending";

interface FormState {
  nameAr: string;
  status: OrgStatus;
}

const EMPTY_FORM: FormState = {
  nameAr: "",
  status: "active",
};

const FALLBACK_CENTER: LatLng = { lat: 24.72169, lng: 46.75702 };
const FALLBACK_ZOOM = 3;

function organizationToForm(org: Organization): FormState {
  return {
    nameAr: org.nameAr,
    status: org.status === "pending" ? "pending" : "active",
  };
}

function organizationToLocation(org: Organization): LatLng | null {
  if (org.lat == null || org.lng == null) return null;
  return { lat: org.lat, lng: org.lng };
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Organization | null;
  onSuccess?: () => void;
}

export function OrganizationFormSheet({
  open,
  onOpenChange,
  initial,
  onSuccess,
}: Props) {
  const t = useTranslations("OrganizationsPage");
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
    setForm(initial ? organizationToForm(initial) : EMPTY_FORM);
    setLocation(initial ? organizationToLocation(initial) : null);
    setSubmitError(null);
    setFieldErrors({});
  }, [open, initial]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        setSubmitting(false);
      }
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

  const handleLocationChange = useCallback((next: LatLng | null) => {
    setLocation(next);
    setFieldErrors((prev) => {
      if (!prev.location) return prev;
      const next = { ...prev };
      delete next.location;
      return next;
    });
  }, []);

  const validate = (): {
    ok: boolean;
    errors: Partial<Record<keyof FormState | "location", string>>;
  } => {
    const errors: Partial<Record<keyof FormState | "location", string>> = {};
    if (!form.nameAr.trim()) errors.nameAr = t("formErrorNameAr");
    if (!location) errors.location = t("formErrorLocation");
    return { ok: Object.keys(errors).length === 0, errors };
  };

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
    const payload: Record<string, unknown> = isEdit
      ? {
          nameAr,
          status: form.status,
          lat: location!.lat,
          lng: location!.lng,
        }
      : {
          nameAr,
          nameEn: nameAr,
          short: nameAr,
          kind: "other",
          status: form.status,
          lat: location!.lat,
          lng: location!.lng,
        };

    setSubmitting(true);
    setSubmitError(null);
    try {
      const url = isEdit
        ? `/api/admin/organizations/${initial!.id}`
        : "/api/admin/organizations";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as ApiEnvelope<unknown>;
      if (!res.ok || json.error) {
        throw new Error(json.error?.message ?? "Request failed");
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
            <SheetTitle className="text-aws-text text-[18px] font-bold leading-snug">
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
              error={fieldErrors.nameAr}
            >
              <input
                type="text"
                value={form.nameAr}
                onChange={(e) => update("nameAr", e.target.value)}
                className={inputCls(!!fieldErrors.nameAr)}
                dir="rtl"
              />
            </Field>

            <Field label={t("formFieldStatus")} required>
              <select
                value={form.status}
                onChange={(e) =>
                  update("status", e.target.value as OrgStatus)
                }
                className={inputCls(false)}
                dir="rtl"
              >
                <option value="active">{t("statusActive")}</option>
                <option value="pending">{t("statusPending")}</option>
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
