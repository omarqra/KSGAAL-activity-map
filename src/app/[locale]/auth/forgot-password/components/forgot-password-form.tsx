"use client";

import { useMemo, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, CheckCircle2, Loader2, Mail, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { cn } from "@/lib/utils";

type FormValues = {
  email: string;
};

export default function ForgotPasswordForm({ locale }: { locale: string }) {
  const isAr = locale === "ar";
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const schema = useMemo(
    () =>
      z.object({
        email: z
          .string()
          .min(1, {
            message: isAr ? "البريد الإلكتروني مطلوب" : "Email is required",
          })
          .email({
            message: isAr
              ? "صيغة البريد الإلكتروني غير صحيحة"
              : "Please enter a valid email address",
          }),
      }),
    [isAr]
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: FormValues) => {
    setFormError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, locale }),
      });
      if (res.ok) {
        setDone(true);
      } else {
        setFormError(
          isAr ? "حدث خطأ، حاول مرة أخرى" : "Something went wrong, try again"
        );
      }
    } catch {
      setFormError(
        isAr ? "خطأ في الشبكة" : "Network error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <CheckCircle2 className="h-12 w-12 text-[#024E28]" />
        <p className="text-[15px] font-semibold text-[#082F18]">
          {isAr ? "تحقق من بريدك" : "Check your inbox"}
        </p>
        <p className="text-[13px] leading-relaxed text-[#6b6256]">
          {isAr
            ? "إذا كان البريد الإلكتروني مرتبطاً بحساب لدينا، فستتلقى رابطاً لإعادة تعيين كلمة المرور خلال دقائق."
            : "If that email is associated with an account, you'll receive a reset link within a few minutes."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="block text-[12.5px] font-semibold text-[#082F18]"
        >
          {isAr ? "البريد الإلكتروني" : "Email address"}
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
          <Send className="h-4 w-4" />
        )}
        <span>
          {submitting
            ? isAr
              ? "جاري الإرسال..."
              : "Sending..."
            : isAr
              ? "إرسال رابط إعادة التعيين"
              : "Send reset link"}
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
