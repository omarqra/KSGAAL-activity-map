"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { Save, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { resolveApiErrorMessage } from "@/lib/api-error";

import type { ActivitySubtype, ActivityType } from "../_lib/api";

interface ApiEnvelope<T> {
  data: T | null;
  error: { message: string; code?: string; details?: unknown } | null;
}

interface FormState {
  parentTypeId: string;
  labelAr: string;
  labelEn: string;
}

const EMPTY_FORM: FormState = {
  parentTypeId: "",
  labelAr: "",
  labelEn: "",
};

function subtypeToForm(s: ActivitySubtype): FormState {
  return {
    parentTypeId: String(s.parentTypeId),
    labelAr: s.labelAr,
    labelEn: s.labelEn,
  };
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: ActivitySubtype | null;
  mainTypes: ActivityType[];
  onSuccess?: () => void;
}

export function ActivitySubtypeFormSheet({
  open,
  onOpenChange,
  initial,
  mainTypes,
  onSuccess,
}: Props) {
  const t = useTranslations("ActivityTypesPage");
  const tErr = useTranslations("ApiErrors");
  const router = useRouter();
  const isEdit = !!initial;

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({});

  const sortedTypes = useMemo(
    () =>
      mainTypes
        .slice()
        .sort((a, b) => a.labelAr.localeCompare(b.labelAr, "ar")),
    [mainTypes]
  );

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm(subtypeToForm(initial));
    } else {
      setForm({
        ...EMPTY_FORM,
        parentTypeId:
          sortedTypes.length === 1 ? String(sortedTypes[0].id) : "",
      });
    }
    setSubmitError(null);
    setFieldErrors({});
  }, [open, initial, sortedTypes]);

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
    const pid = Number(form.parentTypeId);
    if (!Number.isInteger(pid) || pid <= 0)
      errors.parentTypeId = t("formErrorParentType");
    if (!form.labelAr.trim()) errors.labelAr = t("formErrorLabelAr");
    if (!form.labelEn.trim()) errors.labelEn = t("formErrorLabelEn");
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
      parentTypeId: Number(form.parentTypeId),
      labelAr: form.labelAr.trim(),
      labelEn: form.labelEn.trim(),
    };

    setSubmitting(true);
    setSubmitError(null);
    try {
      const url = isEdit
        ? `/api/admin/activity-subtypes/${initial!.id}`
        : "/api/admin/activity-subtypes";
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
            <SheetTitle className="text-aws-text text-[18px] font-bold leading-snug">
              {isEdit ? t("formTitleEditSub") : t("formTitleCreateSub")}
            </SheetTitle>
            <p className="text-aws-text2 mt-1 text-[12px] leading-relaxed">
              {isEdit
                ? t("formDescriptionEditSub")
                : t("formDescriptionCreateSub")}
            </p>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
            <Field
              label={t("formFieldParentType")}
              required
              error={fieldErrors.parentTypeId}
            >
              <select
                value={form.parentTypeId}
                onChange={(e) => update("parentTypeId", e.target.value)}
                className={inputCls(!!fieldErrors.parentTypeId)}
              >
                <option value="">{t("formFieldParentTypePlaceholder")}</option>
                {sortedTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.labelAr}
                  </option>
                ))}
              </select>
            </Field>

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
