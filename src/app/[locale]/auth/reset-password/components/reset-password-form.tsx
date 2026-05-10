/* eslint-disable max-lines */
"use client";

import { useMemo, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { cn } from "@/lib/utils";

type FormValues = {
  password: string;
  confirm: string;
};

const passwordRules = (isAr: boolean) =>
  z
    .string()
    .min(8, {
      message: isAr ? "8 أحرف على الأقل" : "At least 8 characters",
    })
    .max(128, {
      message: isAr ? "128 حرفاً كحد أقصى" : "At most 128 characters",
    })
    .regex(/[a-z]/, {
      message: isAr ? "يجب أن تحوي حرفاً صغيراً" : "Must contain a lowercase letter",
    })
    .regex(/[A-Z]/, {
      message: isAr ? "يجب أن تحوي حرفاً كبيراً" : "Must contain an uppercase letter",
    })
    .regex(/\d/, {
      message: isAr ? "يجب أن تحوي رقماً" : "Must contain a digit",
    })
    .regex(/[^A-Za-z0-9]/, {
      message: isAr ? "يجب أن تحوي رمزاً خاصاً" : "Must contain a special character",
    });

export default function ResetPasswordForm({
  locale,
  token,
}: {
  locale: string;
  token: string;
}) {
  const isAr = locale === "ar";
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const schema = useMemo(
    () =>
      z
        .object({
          password: passwordRules(isAr),
          confirm: z.string().min(1),
        })
        .refine((v) => v.password === v.confirm, {
          message: isAr ? "كلمتا المرور غير متطابقتين" : "Passwords do not match",
          path: ["confirm"],
        }),
    [isAr]
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirm: "" },
  });

  const onSubmit = async (data: FormValues) => {
    setFormError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: data.password }),
      });
      if (res.ok) {
        setDone(true);
        setTimeout(() => {
          window.location.href = `/${locale}/auth/login`;
        }, 2500);
        return;
      }
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (json.error === "invalid_or_expired_token") {
        setFormError(
          isAr
            ? "الرابط غير صالح أو منتهي الصلاحية"
            : "Link is invalid or expired"
        );
      } else {
        setFormError(
          isAr ? "حدث خطأ، حاول مرة أخرى" : "Something went wrong, try again"
        );
      }
    } catch {
      setFormError(isAr ? "خطأ في الشبكة" : "Network error");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <CheckCircle2 className="h-12 w-12 text-[#024E28]" />
        <p className="text-[15px] font-semibold text-[#082F18]">
          {isAr ? "تم تغيير كلمة المرور" : "Password updated"}
        </p>
        <p className="text-[13px] leading-relaxed text-[#6b6256]">
          {isAr
            ? "جارٍ تحويلك إلى صفحة تسجيل الدخول..."
            : "Redirecting you to the login page..."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="block text-[12.5px] font-semibold text-[#082F18]"
        >
          {isAr ? "كلمة المرور الجديدة" : "New password"}
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
            type={showPwd ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            aria-invalid={!!errors.password}
            {...register("password")}
            className={cn(
              "w-full rounded-md border bg-white py-2.5 text-[14px] text-[#082F18]",
              "placeholder:text-[#9aa099] focus:ring-2 focus:ring-[#082F18]/30 focus:outline-none",
              isAr ? "pr-10 pl-11 text-right" : "pr-11 pl-10",
              errors.password
                ? "border-rose-500 focus:ring-rose-200"
                : "border-[#d8d2c2] focus:border-[#082F18]"
            )}
          />
          <button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            className={cn(
              "absolute top-1/2 -translate-y-1/2 rounded-sm p-1 text-[#082F18]/60 hover:bg-[#082F18]/5",
              isAr ? "left-2" : "right-2"
            )}
          >
            {showPwd ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-[12px] text-rose-600">{errors.password.message}</p>
        )}
        <p className="text-[11.5px] leading-relaxed text-[#6b6256]">
          {isAr
            ? "8 أحرف+ تشمل: حرفاً كبيراً، صغيراً، رقماً، ورمزاً خاصاً"
            : "8+ chars including: uppercase, lowercase, digit, and a symbol"}
        </p>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="confirm"
          className="block text-[12.5px] font-semibold text-[#082F18]"
        >
          {isAr ? "تأكيد كلمة المرور" : "Confirm password"}
        </label>
        <div className="relative">
          <Lock
            className={cn(
              "pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa099]",
              isAr ? "right-3" : "left-3"
            )}
          />
          <input
            id="confirm"
            type={showPwd ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            aria-invalid={!!errors.confirm}
            {...register("confirm")}
            className={cn(
              "w-full rounded-md border bg-white py-2.5 text-[14px] text-[#082F18]",
              "placeholder:text-[#9aa099] focus:ring-2 focus:ring-[#082F18]/30 focus:outline-none",
              isAr ? "pr-10 pl-4 text-right" : "pr-4 pl-10",
              errors.confirm
                ? "border-rose-500 focus:ring-rose-200"
                : "border-[#d8d2c2] focus:border-[#082F18]"
            )}
          />
        </div>
        {errors.confirm && (
          <p className="text-[12px] text-rose-600">{errors.confirm.message}</p>
        )}
      </div>

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
          "hover:bg-[#0a3621] focus:ring-2 focus:ring-[#082F18]/40 focus:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-70"
        )}
      >
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Lock className="h-4 w-4" />
        )}
        <span>
          {submitting
            ? isAr
              ? "جاري الحفظ..."
              : "Saving..."
            : isAr
              ? "تحديث كلمة المرور"
              : "Update password"}
        </span>
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
