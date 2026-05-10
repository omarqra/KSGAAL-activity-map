"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";

import { Save, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

import type { ActivityType } from "../_lib/api";

interface ApiEnvelope<T> {
  data: T | null;
  error: { message: string; code?: string; details?: unknown } | null;
}

interface FormState {
  labelAr: string;
  labelEn: string;
  color: string;
}

const BRAND_SWATCHES = [
  "#024E28",
  "#082F18",
  "#193D58",
  "#459AA8",
  "#D56028",
  "#F5CC44",
  "#57072D",
  "#474747",
];

const EMPTY_FORM: FormState = {
  labelAr: "",
  labelEn: "",
  color: "#024E28",
};

function normalizeColor(value: string): string {
  const v = value.trim();
  if (!v) return "#024E28";
  return v.startsWith("#") ? v : `#${v}`;
}

function activityTypeToForm(type: ActivityType): FormState {
  return {
    labelAr: type.labelAr,
    labelEn: type.labelEn,
    color: normalizeColor(type.color || "#024E28"),
  };
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: ActivityType | null;
  onSuccess?: () => void;
}

export function ActivityTypeFormSheet({
  open,
  onOpenChange,
  initial,
  onSuccess,
}: Props) {
  const t = useTranslations("ActivityTypesPage");
  const router = useRouter();
  const isEdit = !!initial;

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({});

  useEffect(() => {
    if (!open) return;
    setForm(initial ? activityTypeToForm(initial) : EMPTY_FORM);
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
    errors: Partial<Record<keyof FormState, string>>;
  } => {
    const errors: Partial<Record<keyof FormState, string>> = {};
    if (!form.labelAr.trim()) errors.labelAr = t("formErrorLabelAr");
    if (!form.labelEn.trim()) errors.labelEn = t("formErrorLabelEn");
    const color = normalizeColor(form.color);
    if (!/^#[0-9a-fA-F]{3,8}$/.test(color)) errors.color = t("formErrorColor");
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

    const payload: Record<string, unknown> = {
      labelAr: form.labelAr.trim(),
      labelEn: form.labelEn.trim(),
      color: normalizeColor(form.color),
    };

    setSubmitting(true);
    setSubmitError(null);
    try {
      const url = isEdit
        ? `/api/admin/activity-types/${initial!.id}`
        : "/api/admin/activity-types";
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
              {isEdit ? t("formTitleEditMain") : t("formTitleCreateMain")}
            </SheetTitle>
            <p className="text-aws-text2 mt-1 text-[12px] leading-relaxed">
              {isEdit
                ? t("formDescriptionEditMain")
                : t("formDescriptionCreateMain")}
            </p>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
            <div className="grid grid-cols-2 gap-3">
              <Field
                label={t("formFieldLabelAr")}
                required
                error={fieldErrors.labelAr}
              >
                <input
                  type="text"
                  value={form.labelAr}
                  onChange={(e) => update("labelAr", e.target.value)}
                  className={inputCls(!!fieldErrors.labelAr)}
                  dir="rtl"
                />
              </Field>
              <Field
                label={t("formFieldLabelEn")}
                required
                error={fieldErrors.labelEn}
              >
                <input
                  type="text"
                  value={form.labelEn}
                  onChange={(e) => update("labelEn", e.target.value)}
                  className={inputCls(!!fieldErrors.labelEn)}
                  dir="ltr"
                />
              </Field>
            </div>

            <Field
              label={t("formFieldColor")}
              required
              error={fieldErrors.color}
              hint={t("formFieldColorHint")}
            >
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={normalizeColor(form.color)}
                  onChange={(e) => update("color", e.target.value)}
                  className="border-aws-border h-9 w-12 cursor-pointer rounded border bg-white p-1"
                  aria-label={t("formFieldColor")}
                />
                <input
                  type="text"
                  value={form.color}
                  onChange={(e) => update("color", e.target.value)}
                  placeholder="#024E28"
                  className={`${inputCls(!!fieldErrors.color)} num`}
                  dir="ltr"
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {BRAND_SWATCHES.map((swatch) => {
                  const isSelected =
                    normalizeColor(form.color).toLowerCase() ===
                    swatch.toLowerCase();
                  return (
                    <button
                      key={swatch}
                      type="button"
                      onClick={() => update("color", swatch)}
                      style={{ background: swatch }}
                      className={`h-6 w-6 rounded border-2 transition ${
                        isSelected
                          ? "border-aws-text scale-110"
                          : "border-transparent hover:scale-105"
                      }`}
                      aria-label={swatch}
                      title={swatch}
                    />
                  );
                })}
              </div>
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
        <div className="text-aws-text3 mt-1 text-[11px]">{hint}</div>
      ) : null}
    </label>
  );
}
