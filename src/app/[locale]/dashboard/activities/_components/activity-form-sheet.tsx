"use client";

import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Building2,
  Globe2,
  ImagePlus,
  Loader2,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { uploadFile } from "@/utils/upload-file";

import type { ApiActivity } from "../_lib/api";
import {
  ActivityLocationPicker,
  type LatLng,
} from "./activity-location-picker";

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
  lat: number;
  lng: number;
}

interface OrganizationLite {
  id: number;
  code: string;
  nameAr: string;
  countryId: number | null;
}

interface Lookups {
  types: ActivityTypeLite[];
  countries: CountryLite[];
  organizations: OrganizationLite[];
}

interface ApiEnvelope<T> {
  data: T | null;
  error: { message: string; code?: string; details?: unknown } | null;
}

type HostKind = "country" | "organization";

interface FormState {
  name: string;
  titleEn: string;
  typeId: string;
  subtypeId: string;
  hostKind: HostKind;
  countryId: string;
  organizationId: string;
  year: string;
  dateDetails: string;
  startDate: string;
  endDate: string;
  description: string;
  images: string[];
}

const EMPTY_FORM: FormState = {
  name: "",
  titleEn: "",
  typeId: "",
  subtypeId: "",
  hostKind: "country",
  countryId: "",
  organizationId: "",
  year: "",
  dateDetails: "",
  startDate: "",
  endDate: "",
  description: "",
  images: [],
};

// BRD feedback #8/#38: client-side image rules mirroring the server.
const MAX_IMAGES = 5;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const RATIO_TOLERANCE = 0.05; // 16:9 ± 5%

const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const DESC_MIN_WORDS = 50;
const DESC_MAX_WORDS = 150;

/** Validate one image file against type/size, then async-check the 16:9 ratio.
    Returns a translation-key error string, or null when the image is valid. */
function checkImageRatio(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      if (!img.naturalWidth || !img.naturalHeight) return resolve(false);
      const ratio = img.naturalWidth / img.naturalHeight;
      resolve(Math.abs(ratio - 16 / 9) <= (16 / 9) * RATIO_TOLERANCE);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(false);
    };
    img.src = url;
  });
}

const toDateInput = (iso: string | null | undefined): string =>
  iso ? iso.slice(0, 10) : "";

const YEAR_REGEX = /(19|20)\d{2}/;

/* Split a free-text date stored in the DB into (year, details) so the form
   can present them as separate fields. The year is the first 4-digit token
   matching 19xx/20xx; the details are everything else, with the year token
   removed and surrounding punctuation/whitespace cleaned up. */
function splitDateText(raw: string | null | undefined): {
  year: string;
  dateDetails: string;
} {
  const value = (raw ?? "").trim();
  if (!value) return { year: "", dateDetails: "" };
  const match = value.match(YEAR_REGEX);
  if (!match) return { year: "", dateDetails: value };
  const year = match[0];
  const details = value
    .replace(match[0], "")
    /* Only collapse list/comma separators — keep `-` intact so "2-3 فبراير"
       round-trips correctly when re-saving an existing activity. */
    .replace(/[,،·]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return { year, dateDetails: details };
}

function activityToForm(act: ApiActivity): FormState {
  const { year, dateDetails } = splitDateText(act.dateText);
  return {
    name: act.titleAr ?? act.name,
    titleEn: act.titleEn ?? "",
    typeId: String(act.typeId),
    subtypeId: act.subtypeId != null ? String(act.subtypeId) : "",
    hostKind: act.organizationId != null ? "organization" : "country",
    countryId: act.countryId != null ? String(act.countryId) : "",
    organizationId:
      act.organizationId != null ? String(act.organizationId) : "",
    year,
    dateDetails,
    startDate: toDateInput(act.startDate),
    endDate: toDateInput(act.endDate),
    description: act.description ?? "",
    images: act.images ?? [],
  };
}

async function fetchLookup<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: "no-store" });
  const json = (await res.json()) as ApiEnvelope<T>;
  if (json.error || !json.data) {
    throw new Error(json.error?.message ?? "Lookup failed");
  }
  return json.data;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: ApiActivity | null;
}

const FALLBACK_CENTER: LatLng = { lat: 24.72169, lng: 46.75702 };
const FALLBACK_ZOOM = 3;
const HOST_ZOOM = 5;

export function ActivityFormSheet({ open, onOpenChange, initial }: Props) {
  const t = useTranslations("ActivitiesPage");
  const tErr = useTranslations("ApiErrors");
  const router = useRouter();
  const isEdit = !!initial;

  // Resolve a server error code/key to a localized string, falling back to the
  // raw message when the key is unknown.
  const resolveApiError = useCallback(
    (code?: string, message?: string): string => {
      const key = code && code !== "VALIDATION_ERROR" ? code : message;
      if (key) {
        try {
          const translated = tErr(key as never);
          if (translated && translated !== key) return translated;
        } catch {
          /* unknown key — fall through to raw message */
        }
      }
      return message ?? t("formErrorGenericUpdate");
    },
    [tErr, t]
  );

  const [lookups, setLookups] = useState<Lookups | null>(null);
  const [lookupsError, setLookupsError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [location, setLocation] = useState<LatLng | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [draftNotice, setDraftNotice] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({});
  const fetchedRef = useRef(false);

  // BRD feedback #16/#27: a per-activity draft key so unsaved input survives a
  // session expiry or a failed save (connection loss).
  const draftKey = `activity-draft-${initial?.id ?? "new"}`;

  const lookupsLoading = open && !lookups && !lookupsError;

  useEffect(() => {
    if (!open || fetchedRef.current) return;
    fetchedRef.current = true;
    let cancelled = false;
    Promise.all([
      fetchLookup<{ items: ActivityTypeLite[] }>("/api/admin/activity-types"),
      fetchLookup<{ items: CountryLite[] }>(
        "/api/admin/countries?pageSize=300"
      ),
      fetchLookup<{ items: OrganizationLite[] }>(
        "/api/admin/organizations?pageSize=300"
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
        setLookupsError(t("formErrorLoadLookups"));
      });
    return () => {
      cancelled = true;
    };
  }, [open, t]);

  useEffect(() => {
    if (!open) return;
    const base = initial ? activityToForm(initial) : EMPTY_FORM;
    let nextForm = base;
    let nextLocation: LatLng | null =
      initial && initial.lat != null && initial.lng != null
        ? { lat: initial.lat, lng: initial.lng }
        : null;
    let restored = false;
    // Restore a locally saved draft (session expiry / failed save) if present.
    try {
      const raw = window.localStorage.getItem(draftKey);
      if (raw) {
        const draft = JSON.parse(raw) as {
          form?: Partial<FormState>;
          location?: LatLng | null;
        };
        if (draft.form) {
          nextForm = { ...base, ...draft.form };
          nextLocation = draft.location ?? null;
          restored = true;
        }
      }
    } catch {
      /* ignore malformed draft */
    }
    // This effect intentionally syncs props + a restored localStorage draft
    // into form state when the sheet opens (initialization, not derived state).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm(nextForm);
    setLocation(nextLocation);
    setDraftNotice(restored ? t("formDraftRestored") : null);
    setSubmitError(null);
    setFieldErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial]);

  const saveDraft = useCallback(
    (currentForm: FormState, currentLocation: LatLng | null) => {
      try {
        window.localStorage.setItem(
          draftKey,
          JSON.stringify({ form: currentForm, location: currentLocation })
        );
      } catch {
        /* storage unavailable — best effort */
      }
    },
    [draftKey]
  );

  const clearDraft = useCallback(() => {
    try {
      window.localStorage.removeItem(draftKey);
    } catch {
      /* ignore */
    }
  }, [draftKey]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) setSubmitting(false);
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
      setFieldErrors((prev) => {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    []
  );

  const setImageError = useCallback((msg: string | null) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (msg) next.images = msg;
      else delete next.images;
      return next;
    });
  }, []);

  const handleAddImages = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setImageError(null);
      const slotsLeft = MAX_IMAGES - form.images.length;
      if (slotsLeft <= 0) {
        setImageError(t("formErrorImagesMax"));
        return;
      }
      const picked = Array.from(files).slice(0, slotsLeft);
      setUploadingImage(true);
      try {
        for (const file of picked) {
          if (!IMAGE_TYPES.includes(file.type)) {
            setImageError(t("formErrorImageType"));
            continue;
          }
          if (file.size > MAX_IMAGE_BYTES) {
            setImageError(t("formErrorImageSize"));
            continue;
          }
          const ratioOk = await checkImageRatio(file);
          if (!ratioOk) {
            setImageError(t("formErrorImageRatio"));
            continue;
          }
          try {
            const path = await uploadFile(file);
            if (path) {
              setForm((prev) =>
                prev.images.length >= MAX_IMAGES
                  ? prev
                  : { ...prev, images: [...prev.images, path] }
              );
            } else {
              setImageError(t("formErrorImageUpload"));
            }
          } catch {
            setImageError(t("formErrorImageUpload"));
          }
        }
      } finally {
        setUploadingImage(false);
      }
    },
    [form.images.length, setImageError, t]
  );

  const removeImage = useCallback((url: string) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((u) => u !== url),
    }));
  }, []);

  const subtypes = useMemo(() => {
    if (!lookups || !form.typeId) return [];
    const tid = Number(form.typeId);
    const parent = lookups.types.find((x) => x.id === tid);
    return parent?.subtypes ?? [];
  }, [lookups, form.typeId]);

  const sortedCountries = useMemo(
    () =>
      (lookups?.countries ?? [])
        .slice()
        .sort((a, b) => a.nameAr.localeCompare(b.nameAr, "ar")),
    [lookups]
  );

  const sortedOrganizations = useMemo(
    () =>
      (lookups?.organizations ?? [])
        .slice()
        .sort((a, b) => a.nameAr.localeCompare(b.nameAr, "ar")),
    [lookups]
  );

  const hostCenter = useMemo<LatLng | null>(() => {
    if (!lookups) return null;
    if (form.hostKind === "country" && form.countryId) {
      const c = lookups.countries.find((x) => x.id === Number(form.countryId));
      return c ? { lat: c.lat, lng: c.lng } : null;
    }
    if (form.hostKind === "organization" && form.organizationId) {
      const org = lookups.organizations.find(
        (x) => x.id === Number(form.organizationId)
      );
      if (!org?.countryId) return null;
      const c = lookups.countries.find((x) => x.id === org.countryId);
      return c ? { lat: c.lat, lng: c.lng } : null;
    }
    return null;
  }, [lookups, form.hostKind, form.countryId, form.organizationId]);

  const validate = (): {
    ok: boolean;
    errors: Partial<Record<keyof FormState, string>>;
  } => {
    const errors: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) errors.name = t("formErrorName");
    if (!form.typeId) errors.typeId = t("formErrorType");
    if (form.hostKind === "country" && !form.countryId) {
      errors.countryId = t("formErrorHost");
    }
    if (form.hostKind === "organization" && !form.organizationId) {
      errors.organizationId = t("formErrorHost");
    }
    const yearStr = form.year.trim();
    if (yearStr) {
      const yr = Number(yearStr);
      if (!/^\d{4}$/.test(yearStr) || yr < 1900 || yr > 2099) {
        errors.year = t("formErrorYear");
      }
    }
    const desc = form.description.trim();
    if (desc) {
      const w = wordCount(desc);
      if (w < DESC_MIN_WORDS || w > DESC_MAX_WORDS) {
        errors.description = t("formErrorDescription");
      }
    }
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      errors.endDate = t("formErrorEndBeforeStart");
    }
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

    const title = form.name.trim();
    const payload: Record<string, unknown> = {
      name: title,
      titleAr: title,
      titleEn: form.titleEn.trim() || null,
      typeId: Number(form.typeId),
    };
    payload.subtypeId = form.subtypeId ? Number(form.subtypeId) : null;
    if (form.hostKind === "country") {
      payload.countryId = Number(form.countryId);
      payload.organizationId = null;
    } else {
      payload.organizationId = Number(form.organizationId);
      payload.countryId = null;
    }
    const yearStr = form.year.trim();
    const detailsStr = form.dateDetails.trim();
    const combined = [detailsStr, yearStr].filter(Boolean).join(" ").trim();
    payload.dateText = combined || null;
    payload.dateParsed = yearStr
      ? new Date(Date.UTC(Number(yearStr), 0, 1)).toISOString()
      : null;
    payload.startDate = form.startDate
      ? new Date(form.startDate).toISOString()
      : null;
    payload.endDate = form.endDate ? new Date(form.endDate).toISOString() : null;
    payload.description = form.description.trim() || null;
    payload.images = form.images;
    payload.lat = location?.lat ?? null;
    payload.lng = location?.lng ?? null;
    // BRD feedback #10: send the loaded version for optimistic-lock checking.
    if (isEdit) payload.expectedUpdatedAt = initial!.updatedAt;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const url = isEdit
        ? `/api/admin/activities/${initial!.id}`
        : "/api/admin/activities";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      // Session expired (BRD #16): persist a draft and prompt re-login.
      if (res.status === 401) {
        saveDraft(form, location);
        setSubmitError(t("formSessionExpired"));
        return;
      }
      let json: ApiEnvelope<unknown> | null = null;
      try {
        json = (await res.json()) as ApiEnvelope<unknown>;
      } catch {
        /* non-JSON response */
      }
      // Concurrent edit conflict (BRD #10).
      if (res.status === 409) {
        setSubmitError(t("formErrorConflict"));
        return;
      }
      if (!res.ok || json?.error) {
        setSubmitError(
          resolveApiError(json?.error?.code, json?.error?.message)
        );
        return;
      }
      clearDraft();
      handleOpenChange(false);
      router.refresh();
    } catch (err) {
      // A thrown fetch is a network failure (BRD #27): keep input, offer retry.
      if (err instanceof TypeError) {
        saveDraft(form, location);
        setSubmitError(t("formErrorOffline"));
      } else {
        setSubmitError(
          isEdit ? t("formErrorGenericUpdate") : t("formErrorGenericCreate")
        );
      }
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
            {lookupsError && <Banner>{lookupsError}</Banner>}
            {draftNotice && <NoticeBanner>{draftNotice}</NoticeBanner>}

            <Field
              label={t("formFieldName")}
              required
              error={fieldErrors.name}
            >
              <input
                type="text"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder={t("formFieldNamePlaceholder")}
                className={inputCls(!!fieldErrors.name)}
                dir="rtl"
              />
            </Field>

            <Field label={t("formFieldTitleEn")}>
              <input
                type="text"
                value={form.titleEn}
                onChange={(e) => update("titleEn", e.target.value)}
                placeholder={t("formFieldTitleEnPlaceholder")}
                className={inputCls(false)}
                dir="ltr"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field
                label={t("formFieldType")}
                required
                error={fieldErrors.typeId}
              >
                <select
                  value={form.typeId}
                  onChange={(e) => update("typeId", e.target.value)}
                  className={inputCls(!!fieldErrors.typeId)}
                  disabled={!lookups}
                >
                  <option value="">
                    {lookupsLoading
                      ? t("formLoadingLookups")
                      : t("formFieldTypePlaceholder")}
                  </option>
                  {lookups?.types.map((ty) => (
                    <option key={ty.id} value={ty.id}>
                      {ty.labelAr}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label={t("formFieldSubtype")}>
                <select
                  value={form.subtypeId}
                  onChange={(e) => update("subtypeId", e.target.value)}
                  className={inputCls(false)}
                  disabled={subtypes.length === 0}
                >
                  <option value="">{t("formFieldSubtypeNone")}</option>
                  {subtypes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.labelAr}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label={t("formFieldHostKind")} required>
              <div className="flex gap-2">
                <HostToggle
                  active={form.hostKind === "country"}
                  onClick={() => update("hostKind", "country")}
                  icon={<Globe2 className="h-3.5 w-3.5" />}
                  label={t("formHostKindCountry")}
                />
                <HostToggle
                  active={form.hostKind === "organization"}
                  onClick={() => update("hostKind", "organization")}
                  icon={<Building2 className="h-3.5 w-3.5" />}
                  label={t("formHostKindOrganization")}
                />
              </div>
            </Field>

            {form.hostKind === "country" ? (
              <Field
                label={t("formFieldCountry")}
                required
                error={fieldErrors.countryId}
              >
                <select
                  value={form.countryId}
                  onChange={(e) => update("countryId", e.target.value)}
                  className={inputCls(!!fieldErrors.countryId)}
                  disabled={!lookups}
                >
                  <option value="">
                    {lookupsLoading
                      ? t("formLoadingLookups")
                      : t("formFieldHostPlaceholder")}
                  </option>
                  {sortedCountries.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameAr}
                    </option>
                  ))}
                </select>
              </Field>
            ) : (
              <Field
                label={t("formFieldOrganization")}
                required
                error={fieldErrors.organizationId}
              >
                <select
                  value={form.organizationId}
                  onChange={(e) => update("organizationId", e.target.value)}
                  className={inputCls(!!fieldErrors.organizationId)}
                  disabled={!lookups}
                >
                  <option value="">
                    {lookupsLoading
                      ? t("formLoadingLookups")
                      : t("formFieldHostPlaceholder")}
                  </option>
                  {sortedOrganizations.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.nameAr}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            <DateFieldGroup>
              <DateGuide
                title={t("formDateGuideTitle")}
                body={t("formDateGuideBody")}
              />
              <div className="grid grid-cols-[120px_1fr] gap-3">
                <Field
                  label={t("formFieldYear")}
                  error={fieldErrors.year}
                  hint={t("formFieldYearHint")}
                >
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="\d{4}"
                    maxLength={4}
                    value={form.year}
                    onChange={(e) =>
                      update(
                        "year",
                        e.target.value.replace(/\D/g, "").slice(0, 4)
                      )
                    }
                    placeholder={t("formFieldYearPlaceholder")}
                    className={`${inputCls(!!fieldErrors.year)} num`}
                    dir="ltr"
                  />
                </Field>
                <Field
                  label={t("formFieldDateDetails")}
                  hint={t("formFieldDateDetailsHint")}
                >
                  <input
                    type="text"
                    value={form.dateDetails}
                    onChange={(e) => update("dateDetails", e.target.value)}
                    placeholder={t("formFieldDateDetailsPlaceholder")}
                    className={inputCls(false)}
                    dir="rtl"
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t("formFieldStartDate")}>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => update("startDate", e.target.value)}
                    className={`${inputCls(false)} num`}
                    dir="ltr"
                  />
                </Field>
                <Field
                  label={t("formFieldEndDate")}
                  error={fieldErrors.endDate}
                >
                  <input
                    type="date"
                    value={form.endDate}
                    min={form.startDate || undefined}
                    onChange={(e) => update("endDate", e.target.value)}
                    className={`${inputCls(!!fieldErrors.endDate)} num`}
                    dir="ltr"
                  />
                </Field>
              </div>
            </DateFieldGroup>

            <Field
              label={t("formFieldDescription")}
              hint={
                form.description.trim()
                  ? t("formDescWordCount", {
                      count: wordCount(form.description),
                    })
                  : t("formFieldDescriptionHint")
              }
              error={fieldErrors.description}
            >
              <textarea
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder={t("formFieldDescriptionPlaceholder")}
                rows={4}
                className={[
                  "w-full rounded border bg-white px-3 py-2 text-[13px] outline-none",
                  fieldErrors.description
                    ? "border-brand-wine focus:border-brand-wine"
                    : "border-aws-border focus:border-aws-link",
                ].join(" ")}
                dir="rtl"
              />
            </Field>

            <Field
              label={t("formFieldImages")}
              hint={t("formFieldImagesHint")}
              error={fieldErrors.images}
            >
              <ImagesUploader
                images={form.images}
                uploading={uploadingImage}
                disabled={form.images.length >= MAX_IMAGES}
                addLabel={t("formImagesAdd")}
                uploadingLabel={t("formImagesUploading")}
                removeLabel={t("formImageRemove")}
                onAdd={handleAddImages}
                onRemove={removeImage}
              />
            </Field>

            <Field
              label={t("formFieldLocation")}
              hint={t("formFieldLocationHint")}
            >
              <ActivityLocationPicker
                value={location}
                onChange={setLocation}
                defaultCenter={hostCenter ?? FALLBACK_CENTER}
                defaultZoom={hostCenter ? HOST_ZOOM : FALLBACK_ZOOM}
                hostCenter={hostCenter}
                hostZoom={HOST_ZOOM}
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
              disabled={submitting || !lookups}
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

function NoticeBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-brand-green/20 bg-brand-green/5 text-brand-green rounded border px-3 py-2 text-[12px]">
      {children}
    </div>
  );
}

interface ImagesUploaderProps {
  images: string[];
  uploading: boolean;
  disabled: boolean;
  addLabel: string;
  uploadingLabel: string;
  removeLabel: string;
  onAdd: (files: FileList | null) => void;
  onRemove: (url: string) => void;
}

function ImagesUploader({
  images,
  uploading,
  disabled,
  addLabel,
  uploadingLabel,
  removeLabel,
  onAdd,
  onRemove,
}: ImagesUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  return (
    <div className="space-y-2">
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((url) => (
            <div
              key={url}
              className="border-aws-border group relative aspect-video overflow-hidden rounded border bg-gray-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <button
                type="button"
                onClick={() => onRemove(url)}
                title={removeLabel}
                className="absolute end-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          onAdd(e.target.files);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || uploading}
        className="border-aws-border text-aws-text hover:border-aws-text2 inline-flex h-9 items-center justify-center gap-1.5 rounded border border-dashed bg-white px-3 text-[12px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
      >
        {uploading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <ImagePlus className="h-3.5 w-3.5" />
        )}
        <span>{uploading ? uploadingLabel : addLabel}</span>
      </button>
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

interface HostToggleProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function DateFieldGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-aws-border2 space-y-3 rounded border bg-white p-3">
      {children}
    </div>
  );
}

function DateGuide({ title, body }: { title: string; body: string }) {
  return (
    <div className="border-brand-green/20 bg-brand-green/5 rounded border-s-2 px-3 py-2">
      <div className="text-aws-text mb-1 text-[12px] font-semibold">
        {title}
      </div>
      <div className="text-aws-text2 text-[11px] leading-relaxed">{body}</div>
    </div>
  );
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
