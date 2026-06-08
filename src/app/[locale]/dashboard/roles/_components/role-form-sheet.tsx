"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";

import { Save, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { resolveApiErrorMessage } from "@/lib/api-error";
import {
  ACTIONS,
  type Action,
  type PermissionMap,
  RESOURCES,
  type Resource,
  emptyPermissions,
  normalizePermissions,
} from "@/lib/permissions";

import type { Role } from "../_lib/api";

interface FormState {
  key: string;
  nameAr: string;
  nameEn: string;
  permissions: PermissionMap;
}

const EMPTY_FORM: FormState = {
  key: "",
  nameAr: "",
  nameEn: "",
  permissions: emptyPermissions(),
};

interface ApiEnvelope<T> {
  data: T | null;
  error: { message: string; code?: string; details?: unknown } | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Role | null;
}

export function RoleFormSheet({ open, onOpenChange, initial }: Props) {
  const t = useTranslations("RolesPage");
  const tErr = useTranslations("ApiErrors");
  const router = useRouter();
  const isEdit = !!initial;
  const locked = !!initial?.isSystem;

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({});

  useEffect(() => {
    if (!open) return;
    const next: FormState = initial
      ? {
          key: initial.key,
          nameAr: initial.nameAr,
          nameEn: initial.nameEn,
          permissions: normalizePermissions(initial.permissions),
        }
      : EMPTY_FORM;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm(next);
    setSubmitError(null);
    setFieldErrors({});
  }, [open, initial]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) setSubmitting(false);
      onOpenChange(nextOpen);
    },
    [onOpenChange],
  );

  const togglePermission = (resource: Resource, action: Action) => {
    if (locked) return;
    setForm((prev) => {
      const cell = { ...(prev.permissions[resource] ?? {}) };
      cell[action] = !cell[action];
      return {
        ...prev,
        permissions: { ...prev.permissions, [resource]: cell },
      };
    });
  };

  const toggleResourceRow = (resource: Resource, value: boolean) => {
    if (locked) return;
    setForm((prev) => {
      const cell: Record<string, boolean> = {};
      for (const a of ACTIONS) cell[a] = value;
      return {
        ...prev,
        permissions: { ...prev.permissions, [resource]: cell },
      };
    });
  };

  const validate = () => {
    const errors: Partial<Record<keyof FormState, string>> = {};
    if (!isEdit && !/^[a-z0-9_-]{2,40}$/.test(form.key.trim())) {
      errors.key = t("formErrorKey");
    }
    if (!form.nameAr.trim()) errors.nameAr = t("formErrorName");
    if (!form.nameEn.trim()) errors.nameEn = t("formErrorName");
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
      nameAr: form.nameAr.trim(),
      nameEn: form.nameEn.trim(),
    };
    if (!isEdit) payload.key = form.key.trim();
    if (!locked) payload.permissions = form.permissions;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const url = isEdit
        ? `/api/admin/roles/${initial!.id}`
        : "/api/admin/roles";
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
            isEdit ? t("formErrorGenericUpdate") : t("formErrorGenericCreate"),
          ),
        );
      }
      handleOpenChange(false);
      router.refresh();
    } catch (err) {
      setSubmitError(
        err instanceof Error && err.message
          ? err.message
          : isEdit
            ? t("formErrorGenericUpdate")
            : t("formErrorGenericCreate"),
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
        className="!max-w-[560px] gap-0 bg-white p-0 sm:!max-w-[560px]"
      >
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <header className="border-aws-border2 border-b px-5 pt-5 pb-4">
            <SheetTitle className="text-aws-text text-[18px] font-bold leading-snug">
              {isEdit ? t("formTitleEdit") : t("formTitleCreate")}
            </SheetTitle>
            <p className="text-aws-text2 mt-1 text-[12px] leading-relaxed">
              {locked ? t("formSystemNote") : t("formDescription")}
            </p>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("formFieldNameAr")} required error={fieldErrors.nameAr}>
                <input
                  type="text"
                  value={form.nameAr}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, nameAr: e.target.value }))
                  }
                  className={inputCls(!!fieldErrors.nameAr)}
                  dir="rtl"
                />
              </Field>
              <Field label={t("formFieldNameEn")} required error={fieldErrors.nameEn}>
                <input
                  type="text"
                  value={form.nameEn}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, nameEn: e.target.value }))
                  }
                  className={inputCls(!!fieldErrors.nameEn)}
                  dir="ltr"
                />
              </Field>
            </div>

            {!isEdit && (
              <Field
                label={t("formFieldKey")}
                required
                hint={t("formFieldKeyHint")}
                error={fieldErrors.key}
              >
                <input
                  type="text"
                  value={form.key}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      key: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""),
                    }))
                  }
                  placeholder="content_manager"
                  className={`${inputCls(!!fieldErrors.key)} num`}
                  dir="ltr"
                />
              </Field>
            )}

            <div>
              <div className="text-aws-text mb-2 text-[13px] font-semibold">
                {t("permissionsTitle")}
              </div>
              {locked && (
                <div className="border-brand-green/20 bg-brand-green/5 text-brand-green mb-2 rounded border px-3 py-2 text-[12px]">
                  {t("formSystemLocked")}
                </div>
              )}
              <table className="w-full border-collapse text-[12.5px]">
                <thead>
                  <tr className="text-aws-text2">
                    <th className="border-aws-border border-b py-2 text-start font-semibold">
                      {t("colResource")}
                    </th>
                    {ACTIONS.map((a) => (
                      <th
                        key={a}
                        className="border-aws-border border-b py-2 text-center font-semibold"
                      >
                        {t(`action_${a}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {RESOURCES.map((resource) => {
                    const cell = form.permissions[resource] ?? {};
                    const allOn = ACTIONS.every((a) => cell[a]);
                    return (
                      <tr key={resource}>
                        <td className="border-aws-border2 border-b py-2">
                          <button
                            type="button"
                            disabled={locked}
                            onClick={() => toggleResourceRow(resource, !allOn)}
                            className="text-aws-link text-start font-medium hover:underline disabled:text-aws-text disabled:no-underline"
                          >
                            {t(`resource_${resource}`)}
                          </button>
                        </td>
                        {ACTIONS.map((a) => (
                          <td
                            key={a}
                            className="border-aws-border2 border-b py-2 text-center"
                          >
                            <input
                              type="checkbox"
                              checked={!!cell[a]}
                              disabled={locked}
                              onChange={() => togglePermission(resource, a)}
                              className="accent-brand-green h-4 w-4"
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
