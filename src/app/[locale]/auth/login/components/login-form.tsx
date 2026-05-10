/* eslint-disable react-hooks/immutability */
/* eslint-disable max-lines */
"use client";

import { useMemo, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogIn,
  Mail,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { cn } from "@/lib/utils";

type FormValues = {
  email: string;
  password: string;
  remember?: boolean;
};

export default function LoginForm({ locale }: { locale: string }) {
  const t = useTranslations();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const isAr = locale === "ar";

  const schema = useMemo(
    () =>
      z.object({
        email: z
          .string()
          .min(1, {
            message: isAr
              ? "البريد الإلكتروني مطلوب"
              : "Email address is required",
          })
          .email({
            message: isAr
              ? "صيغة البريد الإلكتروني غير صحيحة"
              : "Please enter a valid email address",
          }),
        password: z
          .string()
          .min(1, {
            message: isAr ? "كلمة المرور مطلوبة" : "Password is required",
          })
          .min(8, {
            message: isAr
              ? "يجب ألّا تقلّ كلمة المرور عن ٨ أحرف"
              : "Password must be at least 8 characters",
          }),
        remember: z.boolean().optional(),
      }),
    [isAr]
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", remember: true },
  });

  const onSubmit = async (data: FormValues) => {
    setFormError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email: data.email, password: data.password }),
      });

      if (res.ok) {
        const json = (await res.json().catch(() => ({}))) as {
          requires2FA?: boolean;
          email?: string;
          expiresAt?: number;
        };

        if (json.requires2FA && json.email && json.expiresAt) {
          localStorage.setItem("login_email", json.email);
          localStorage.setItem("otp_expires_at", String(json.expiresAt));
          localStorage.removeItem("blockedUntil");
          const params = new URLSearchParams(window.location.search);
          const from = params.get("from") || params.get("redirect");
          const otpUrl = `/${locale}/auth/otp${from ? `?from=${encodeURIComponent(from)}` : ""}`;
          window.location.href = otpUrl;
          return;
        }

        // Fallback (no 2FA path) — should not happen with current backend.
        const params = new URLSearchParams(window.location.search);
        const from = params.get("from") || params.get("redirect");
        const target =
          from && from.startsWith(`/${locale}/`)
            ? from
            : `/${locale}/dashboard`;
        window.location.href = target;
        return;
      }

      const message =
        res.status === 429
          ? t("Too many attempts, try again later")
          : res.status >= 500
            ? t("Server error, try again")
            : t("Invalid credentials");
      setFormError(message);
    } catch {
      setFormError(t("Network error"));
    } finally {
      setSubmitting(false);
    }
  };

  const labelEmail = t("Email address");
  const labelPassword = t("Password");

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {/* Email */}
      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="block text-[12.5px] font-semibold text-[#082F18]"
        >
          {labelEmail}
        </label>
        <div className="relative">
          <Mail
            className={cn(
              "pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa099]",
              isAr ? "right-3" : "left-3"
            )}
          />
          <input
            id="email"
            type="email"
            autoComplete="email"
            dir="ltr"
            placeholder="example@mail.com"
            aria-invalid={!!errors.email}
            {...register("email")}
            className={cn(
              "w-full rounded-md border bg-white py-2.5 text-[14px] text-[#082F18]",
              "placeholder:text-[#9aa099] focus:ring-2 focus:ring-[#082F18]/30 focus:outline-none",
              "transition-shadow",
              isAr ? "pr-10 pl-4 text-right" : "pr-4 pl-10",
              errors.email
                ? "border-rose-500 focus:ring-rose-200"
                : "border-[#d8d2c2] focus:border-[#082F18]"
            )}
          />
        </div>
        {errors.email && (
          <p className="text-[12px] text-rose-600">{errors.email.message}</p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="block text-[12.5px] font-semibold text-[#082F18]"
        >
          {labelPassword}
        </label>
        <div className="relative">
          <Lock
            className={cn(
              "pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa099]",
              isAr ? "right-3" : "left-3"
            )}
          />
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            aria-invalid={!!errors.password}
            {...register("password")}
            className={cn(
              "w-full rounded-md border bg-white py-2.5 text-[14px] text-[#082F18]",
              "placeholder:text-[#9aa099] focus:ring-2 focus:ring-[#082F18]/30 focus:outline-none",
              "transition-shadow",
              isAr ? "pr-10 pl-11 text-right" : "pr-11 pl-10",
              errors.password
                ? "border-rose-500 focus:ring-rose-200"
                : "border-[#d8d2c2] focus:border-[#082F18]"
            )}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className={cn(
              "absolute top-1/2 -translate-y-1/2 rounded-sm p-1 text-[#082F18]/60 hover:bg-[#082F18]/5 hover:text-[#082F18]",
              isAr ? "left-2" : "right-2"
            )}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-[12px] text-rose-600">{errors.password.message}</p>
        )}
      </div>

      {/* Remember me + forgot password */}
      <div className="flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-2 select-none">
          <input
            type="checkbox"
            {...register("remember")}
            className="h-4 w-4 cursor-pointer rounded-sm border-[#d8d2c2] text-[#082F18] accent-[#082F18] focus:ring-[#082F18]/30"
          />
          <span className="text-[12.5px] text-[#6b6256]">{t("Remember me")}</span>
        </label>
        <a
          href={`/${locale}/auth/forgot-password`}
          className="text-[12px] font-semibold text-[#082F18] hover:underline"
        >
          {isAr ? "نسيت كلمة المرور؟" : "Forgot password?"}
        </a>
      </div>

      {/* Form-level error */}
      {formError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-700"
        >
          <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
          <span>{formError}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className={cn(
          "group relative inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#082F18] px-4 py-2.5",
          "text-[14px] font-semibold text-white shadow-sm transition-all",
          "hover:bg-[#0a3621] focus:ring-2 focus:ring-[#082F18]/40 focus:ring-offset-2 focus:ring-offset-white focus:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-70"
        )}
      >
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <LogIn className="h-4 w-4" />
        )}
        <span>{submitting ? t("Sending") : t("Login")}</span>
        {!submitting && (
          <ArrowRight
            className={cn(
              "h-4 w-4 opacity-0 transition-all group-hover:opacity-100",
              isAr
                ? "rotate-180 group-hover:-translate-x-0.5"
                : "group-hover:translate-x-0.5"
            )}
          />
        )}
      </button>
    </form>
  );
}

