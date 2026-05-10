/* eslint-disable max-lines */
"use client";

import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Building2, Globe2, Save, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

interface ActivitySubtypeLite {
  id: number;
  parentTypeId: number;
  labelAr: string;
  labelEn: string;
}

interface ActivityTypeLite {
  id: number;
  key: string;
  labelAr: string;
  labelEn: string;
  color: string;
  subtypes: ActivitySubtypeLite[];
}

interface CountryLite {
  id: number;
  code: string;
  nameAr: string;
}

interface OrganizationLite {
  id: number;
  code: string;
  nameAr: string;
}

interface Lookups {
  types: ActivityTypeLite[];
  countries: CountryLite[];
  organizations: OrganizationLite[];
}

interface ApiEnvelope<T> {
  data: T | null;
  error: { message: string } | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type HostKind = "country" | "organization";

interface FormState {
  name: string;
  typeId: string;
  subtypeId: string;
  hostKind: HostKind;
  countryId: string;
  organizationId: string;
  dateText: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  typeId: "",
  subtypeId: "",
  hostKind: "country",
  countryId: "",
  organizationId: "",
  dateText: "",
};

async function fetchLookup<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: "no-store" });
  const json = (await res.json()) as ApiEnvelope<T>;
  if (json.error || !json.data) {
    throw new Error(json.error?.message ?? "Lookup failed");
  }
  return json.data;
}

export function CreateActivitySheet({ open, onOpenChange }: Props) {
  const t = useTranslations("OverviewPage");
  const router = useRouter();

  const [lookups, setLookups] = useState<Lookups | null>(null);
  const [lookupsError, setLookupsError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  const lookupsLoading = open && !lookups && !lookupsError;

  useEffect(() => {
    if (!open || fetchedRef.current) return;
    fetchedRef.current = true;
    let cancelled = false;
    Promise.all([
      fetchLookup<{ items: ActivityTypeLite[] }>("/api/admin/activity-types"),
      fetchLookup<{ items: CountryLite[] }>(
        "/api/admin/countries?pageSize=100"
      ),
      fetchLookup<{ items: OrganizationLite[] }>(
        "/api/admin/organizations?pageSize=100"
      ),
    ])
      .then(([types, countries, organizations]) => {
        if (cancelled) return;
        setLookups({
          types: types.items,
          countries: countries.items,
          organizations: organizations.items,
        });
      })
      .catch(() => {
        if (cancelled) return;
        fetchedRef.current = false;
        setLookupsError(t("errorLoadLookups"));
      });
    return () => {
      cancelled = true;
    };
  }, [open, t]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        setForm(EMPTY_FORM);
        setSubmitError(null);
        setSubmitting(false);
      }
      onOpenChange(next);
    },
    [onOpenChange]
  );

  const update = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => {
        if (key === "typeId" && value !== prev.typeId) {
          return { ...prev, typeId: String(value), subtypeId: "" };
        }
        if (key === "hostKind") {
          return {
            ...prev,
            hostKind: value as HostKind,
            countryId: "",
            organizationId: "",
          };
        }
        return { ...prev, [key]: value };
      });
    },
    []
  );

  const subtypes = useMemo(() => {
    if (!lookups || !form.typeId) return [];
    const tid = Number(form.typeId);
    const parent = lookups.types.find((x) => x.id === tid);
    return parent?.subtypes ?? [];
  }, [lookups, form.typeId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const name = form.name.trim();
    if (!name) {
      setSubmitError(t("errorRequiredName"));
      return;
    }
    if (!form.typeId) {
      setSubmitError(t("errorRequiredType"));
      return;
    }
    const hostId =
      form.hostKind === "country" ? form.countryId : form.organizationId;
    if (!hostId) {
      setSubmitError(t("errorRequiredHost"));
      return;
    }

    const payload: Record<string, unknown> = {
      name,
      typeId: Number(form.typeId),
    };
    if (form.subtypeId) payload.subtypeId = Number(form.subtypeId);
    if (form.hostKind === "country") {
      payload.countryId = Number(form.countryId);
    } else {
      payload.organizationId = Number(form.organizationId);
    }
    const dateText = form.dateText.trim();
    if (dateText) payload.dateText = dateText;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/admin/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as ApiEnvelope<unknown>;
      if (!res.ok || json.error) {
        throw new Error(json.error?.message ?? "Create failed");
      }
      handleOpenChange(false);
      router.refresh();
    } catch {
      setSubmitError(t("errorGenericCreate"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="left"
        dir="rtl"
        className="!max-w-[460px] gap-0 bg-white p-0 sm:!max-w-[460px]"
      >
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <header className="border-aws-border2 border-b px-5 pt-5 pb-4">
            <SheetTitle className="text-aws-text text-[18px] font-bold leading-snug">
              {t("createSheetTitle")}
            </SheetTitle>
            <p className="text-aws-text2 mt-1 text-[12px] leading-relaxed">
              {t("createSheetDescription")}
            </p>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
            {lookupsError && (
              <div className="border-brand-wine/20 bg-brand-wine/5 text-brand-wine rounded border px-3 py-2 text-[12px]">
                {lookupsError}
              </div>
            )}

            <Field label={t("fieldName")} required>
              <input
                type="text"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder={t("fieldNamePlaceholder")}
                className="border-aws-border focus:border-aws-link h-9 w-full rounded border bg-white px-3 text-[13px] outline-none"
                required
              />
            </Field>

            <Field label={t("fieldType")} required>
              <select
                value={form.typeId}
                onChange={(e) => update("typeId", e.target.value)}
                className="border-aws-border focus:border-aws-link h-9 w-full rounded border bg-white px-3 text-[13px] outline-none"
                required
                disabled={!lookups}
              >
                <option value="">
                  {lookupsLoading
                    ? t("loadingLookups")
                    : t("fieldTypePlaceholder")}
                </option>
                {lookups?.types.map((ty) => (
                  <option key={ty.id} value={ty.id}>
                    {ty.labelAr}
                  </option>
                ))}
              </select>
            </Field>

            <Field label={t("fieldSubtype")}>
              <select
                value={form.subtypeId}
                onChange={(e) => update("subtypeId", e.target.value)}
                className="border-aws-border focus:border-aws-link h-9 w-full rounded border bg-white px-3 text-[13px] outline-none disabled:opacity-50"
                disabled={subtypes.length === 0}
              >
                <option value="">{t("fieldSubtypeNone")}</option>
                {subtypes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.labelAr}
                  </option>
                ))}
              </select>
            </Field>

            <Field label={t("fieldHostKind")} required>
              <div className="flex gap-2">
                <HostToggle
                  active={form.hostKind === "country"}
                  onClick={() => update("hostKind", "country")}
                  icon={<Globe2 className="h-3.5 w-3.5" />}
                  label={t("hostKindCountry")}
                />
                <HostToggle
                  active={form.hostKind === "organization"}
                  onClick={() => update("hostKind", "organization")}
                  icon={<Building2 className="h-3.5 w-3.5" />}
                  label={t("hostKindOrganization")}
                />
              </div>
            </Field>

            {form.hostKind === "country" ? (
              <Field label={t("fieldCountry")} required>
                <select
                  value={form.countryId}
                  onChange={(e) => update("countryId", e.target.value)}
                  className="border-aws-border focus:border-aws-link h-9 w-full rounded border bg-white px-3 text-[13px] outline-none"
                  required
                  disabled={!lookups}
                >
                  <option value="">
                    {lookupsLoading
                      ? t("loadingLookups")
                      : t("hostPlaceholder")}
                  </option>
                  {lookups?.countries.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameAr}
                    </option>
                  ))}
                </select>
              </Field>
            ) : (
              <Field label={t("fieldOrganization")} required>
                <select
                  value={form.organizationId}
                  onChange={(e) => update("organizationId", e.target.value)}
                  className="border-aws-border focus:border-aws-link h-9 w-full rounded border bg-white px-3 text-[13px] outline-none"
                  required
                  disabled={!lookups}
                >
                  <option value="">
                    {lookupsLoading
                      ? t("loadingLookups")
                      : t("hostPlaceholder")}
                  </option>
                  {lookups?.organizations.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.nameAr}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            <Field label={t("fieldDateText")} hint={t("fieldDateTextHint")}>
              <input
                type="text"
                value={form.dateText}
                onChange={(e) => update("dateText", e.target.value)}
                className="border-aws-border focus:border-aws-link h-9 w-full rounded border bg-white px-3 text-[13px] outline-none"
              />
            </Field>

            {submitError && (
              <div className="border-brand-wine/20 bg-brand-wine/5 text-brand-wine rounded border px-3 py-2 text-[12px]">
                {submitError}
              </div>
            )}
          </div>

          <footer className="border-aws-border2 flex items-center justify-end gap-2 border-t bg-white px-5 py-3">
            <Button
              type="button"
              variant="default"
              icon={<X className="h-3.5 w-3.5" />}
              onClick={() => handleOpenChange(false)}
              disabled={submitting}
            >
              {t("actionCancel")}
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={<Save className="h-3.5 w-3.5" />}
              disabled={submitting || !lookups}
            >
              {submitting ? t("savingLabel") : t("actionSave")}
            </Button>
          </footer>
        </form>
      </SheetContent>
    </Sheet>
  );
}

interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}

function Field({ label, required, hint, children }: FieldProps) {
  return (
    <label className="block">
      <div className="text-aws-text mb-1 flex items-center gap-1 text-[13px] font-semibold">
        <span>{label}</span>
        {required && <span className="text-brand-wine">*</span>}
      </div>
      {children}
      {hint && (
        <div className="text-aws-text3 mt-1 text-[11px]">{hint}</div>
      )}
    </label>
  );
}

interface HostToggleProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function HostToggle({ active, onClick, icon, label }: HostToggleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "border-brand-green bg-brand-green/5 text-brand-green inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded border px-3 text-[13px] font-semibold"
          : "border-aws-border text-aws-text hover:border-aws-text2 inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded border bg-white px-3 text-[13px] font-semibold"
      }
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
