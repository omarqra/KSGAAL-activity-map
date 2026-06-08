"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";

import { Save, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

import type { AdminUser } from "../_lib/api";

interface ApiEnvelope<T> {
  data: T | null;
  error: { message: string; code?: string; details?: unknown } | null;
}

interface RoleOption {
  id: number;
  nameAr: string;
}

interface FormState {
  name: string;
  email: string;
  password: string;
  roleId: string;
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  password: "",
  roleId: "",
  isActive: true,
};

function userToForm(user: AdminUser): FormState {
  return {
    name: user.name ?? "",
    email: user.email,
    password: "",
    roleId: user.roleId != null ? String(user.roleId) : "",
    isActive: user.isActive,
  };
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: AdminUser | null;
}

export function UserFormSheet({ open, onOpenChange, initial }: Props) {
  const t = useTranslations("UsersPage");
  const router = useRouter();
  const isEdit = !!initial;

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({});

  useEffect(() => {
    if (!open) return;
    setForm(initial ? userToForm(initial) : EMPTY_FORM);
    setSubmitError(null);
    setFieldErrors({});
  }, [open, initial]);

  // Load the assignable roles so the select reflects custom roles too.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch("/api/admin/roles", { cache: "no-store" })
      .then((r) => r.json())
      .then((json: { data?: { items?: RoleOption[] } }) => {
        if (cancelled) return;
        const items = json.data?.items ?? [];
        setRoles(items);
        // Default a new user to the first role (the system Admin) once loaded.
        setForm((prev) =>
          !initial && !prev.roleId && items[0]
            ? { ...prev, roleId: String(items[0].id) }
            : prev,
        );
      })
      .catch(() => {
        if (!cancelled) setRoles([]);
      });
    return () => {
      cancelled = true;
    };
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

  const validatePasswordStrength = (pwd: string): string | null => {
    if (pwd.length < 8) return t("PASSWORD_TOO_SHORT");
    if (pwd.length > 128) return t("PASSWORD_TOO_LONG");
    if (!/[a-z]/.test(pwd)) return t("PASSWORD_MISSING_LOWERCASE");
    if (!/[A-Z]/.test(pwd)) return t("PASSWORD_MISSING_UPPERCASE");
    if (!/\d/.test(pwd)) return t("PASSWORD_MISSING_DIGIT");
    if (!/[^A-Za-z0-9]/.test(pwd)) return t("PASSWORD_MISSING_SYMBOL");
    return null;
  };

  const validate = (): {
    ok: boolean;
    errors: Partial<Record<keyof FormState, string>>;
  } => {
    const errors: Partial<Record<keyof FormState, string>> = {};
    const email = form.email.trim();
    if (!email) {
      errors.email = t("formErrorEmail");
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      errors.email = t("formErrorEmailInvalid");
    }
    const checkPassword = isEdit ? form.password.length > 0 : true;
    if (checkPassword) {
      const pwdError = validatePasswordStrength(form.password);
      if (pwdError) errors.password = pwdError;
    }
    if (!form.roleId) errors.roleId = t("formErrorRole");
    return { ok: Object.keys(errors).length === 0, errors };
  };

  // Map an i18n message key returned from the server to the right field.
  const I18N_KEYS = new Set([
    "PASSWORD_TOO_SHORT",
    "PASSWORD_TOO_LONG",
    "PASSWORD_MISSING_LOWERCASE",
    "PASSWORD_MISSING_UPPERCASE",
    "PASSWORD_MISSING_DIGIT",
    "PASSWORD_MISSING_SYMBOL",
  ]);

  const translateIfKey = (msg: string): string => {
    if (I18N_KEYS.has(msg)) {
      return t(msg as Parameters<typeof t>[0]);
    }
    return msg;
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

    const trimmedName = form.name.trim();
    const payload: Record<string, unknown> = {
      email: form.email.trim(),
      name: trimmedName ? trimmedName : null,
      roleId: form.roleId ? Number(form.roleId) : null,
      isActive: form.isActive,
    };
    if (form.password.length > 0) payload.password = form.password;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const url = isEdit
        ? `/api/admin/users/${initial!.id}`
        : "/api/admin/users";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as ApiEnvelope<unknown>;
      if (!res.ok || json.error) {
        if (res.status === 409) {
          setFieldErrors((prev) => ({
            ...prev,
            email: t("formErrorEmailTaken"),
          }));
          throw new Error(t("formErrorEmailTaken"));
        }
        if (res.status === 422 && json.error?.code === "VALIDATION_ERROR") {
          const issues = json.error.details as
            | Array<{ path: string; message: string }>
            | undefined;
          if (issues && issues.length) {
            const fieldUpdates: Partial<Record<keyof FormState, string>> = {};
            for (const issue of issues) {
              const field = issue.path as keyof FormState;
              if (field === "email" || field === "password" || field === "name") {
                fieldUpdates[field] = translateIfKey(issue.message);
              }
            }
            setFieldErrors((prev) => ({ ...prev, ...fieldUpdates }));
            throw new Error(translateIfKey(issues[0]!.message));
          }
        }
        const message = json.error?.message ?? "Request failed";
        throw new Error(translateIfKey(message));
      }
      handleOpenChange(false);
      router.refresh();
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
              {isEdit
                ? t("formDescriptionEdit")
                : t("formDescriptionCreate")}
            </p>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
            <Field label={t("formFieldName")} error={fieldErrors.name}>
              <input
                type="text"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder={t("formFieldNamePlaceholder")}
                className={inputCls(!!fieldErrors.name)}
                dir="rtl"
              />
            </Field>

            <Field
              label={t("formFieldEmail")}
              required
              error={fieldErrors.email}
            >
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="user@example.com"
                className={inputCls(!!fieldErrors.email)}
                dir="ltr"
                autoComplete="off"
              />
            </Field>

            <Field
              label={t("formFieldPassword")}
              required={!isEdit}
              hint={
                isEdit
                  ? t("formFieldPasswordHintEdit")
                  : t("formFieldPasswordHint")
              }
              error={fieldErrors.password}
            >
              <input
                type="password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                className={inputCls(!!fieldErrors.password)}
                dir="ltr"
                autoComplete="new-password"
                placeholder={
                  isEdit ? t("formFieldPasswordPlaceholderEdit") : undefined
                }
              />
            </Field>

            <Field
              label={t("formFieldRole")}
              required
              hint={t("formFieldRoleHint")}
              error={fieldErrors.roleId}
            >
              <select
                value={form.roleId}
                onChange={(e) => update("roleId", e.target.value)}
                className={inputCls(!!fieldErrors.roleId)}
                dir="rtl"
                disabled={roles.length === 0}
              >
                <option value="">{t("formFieldRolePlaceholder")}</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nameAr}
                  </option>
                ))}
              </select>
            </Field>

            <Field label={t("formFieldStatus")}>
              <label className="border-aws-border bg-white text-aws-text flex h-9 items-center justify-between gap-2 rounded border px-3 text-[13px]">
                <span>
                  {form.isActive ? t("statusActive") : t("statusDisabled")}
                </span>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => update("isActive", e.target.checked)}
                  className="accent-brand-green h-4 w-4"
                />
              </label>
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
