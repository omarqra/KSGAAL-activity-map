/* eslint-disable react-hooks/immutability */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable max-lines */
"use client";

import { useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

import { formatTime } from "./count-down";

type OTPValuesType = {
  code: string;
};

function FormComponent({ locale }: { locale: Locale }) {
  const t = useTranslations();
  const isAr = locale === "ar";

  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [mainTimerExpired, setMainTimerExpired] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);

  useEffect(() => {
    const calculateMainTimerExpiration = () => {
      const otpExpiresAtString = localStorage.getItem("otp_expires_at");
      if (!otpExpiresAtString) {
        setMainTimerExpired(true);
        return;
      }
      const otpExpiresAt = Number(otpExpiresAtString);
      const now = Date.now();
      setMainTimerExpired(otpExpiresAt - now <= 0);
    };

    calculateMainTimerExpiration();
    setIsInitialized(true);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "otp_expires_at") calculateMainTimerExpiration();
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    const id = setInterval(() => {
      const otpExpiresAtString = localStorage.getItem("otp_expires_at");
      if (!otpExpiresAtString) {
        setMainTimerExpired(true);
        return;
      }
      const otpExpiresAt = Number(otpExpiresAtString);
      setMainTimerExpired(otpExpiresAt - Date.now() <= 0);
    }, 1000);
    return () => clearInterval(id);
  }, [isInitialized]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  const formSchema = z.object({
    code: z.string().regex(/^\d{6}$/, t("Invalid code")),
  });

  const form = useForm<OTPValuesType>({
    resolver: zodResolver(formSchema),
    defaultValues: { code: "" },
  });

  const onSubmit = async (data: OTPValuesType) => {
    setSubmitting(true);
    setFormMessage(null);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ code: data.code }),
      });

      if (res.ok) {
        localStorage.removeItem("otp_expires_at");
        localStorage.removeItem("login_email");
        localStorage.removeItem("blockedUntil");

        const params = new URLSearchParams(window.location.search);
        const from = params.get("from");
        const target =
          from && from.startsWith(`/${locale}/`)
            ? from
            : `/${locale}/dashboard`;
        window.location.href = target;
        return;
      }

      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        remainingAttempts?: number;
        retryAfter?: number;
      };

      if (res.status === 429) {
        setFormMessage(t("Too many attempts, try again later"));
        form.setError("code", { message: t("Too many attempts, try again later") });
      } else if (json.error === "otp_expired") {
        setFormMessage(t("Code expired, request a new one"));
        setMainTimerExpired(true);
        form.setError("code", { message: t("Code expired, request a new one") });
      } else if (json.error === "challenge_expired_or_missing") {
        setFormMessage(t("Session expired, please login again"));
        setTimeout(() => {
          window.location.href = `/${locale}/auth/login`;
        }, 1500);
      } else {
        const remaining = json.remainingAttempts;
        const message =
          typeof remaining === "number"
            ? `${t("Invalid code")} (${remaining})`
            : t("Invalid code");
        form.setError("code", { message });
      }
    } catch {
      setFormMessage(t("Network error"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendOTP = async () => {
    setResending(true);
    setFormMessage(null);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        credentials: "same-origin",
      });

      if (res.ok) {
        const json = (await res.json()) as { expiresAt: number };
        if (json.expiresAt) {
          localStorage.setItem("otp_expires_at", String(json.expiresAt));
          setMainTimerExpired(false);
          window.dispatchEvent(new Event("otpExpiresAtUpdated"));
        }
        form.reset();
        setResendCooldown(60);
        return;
      }

      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        retryAfter?: number;
      };
      if (res.status === 429 && json.retryAfter) {
        setResendCooldown(json.retryAfter);
        setFormMessage(t("Too many attempts, try again later"));
      } else if (json.error === "challenge_expired_or_missing") {
        setFormMessage(t("Session expired, please login again"));
        setTimeout(() => {
          window.location.href = `/${locale}/auth/login`;
        }, 1500);
      } else {
        setFormMessage(t("Server error, try again"));
      }
    } catch {
      setFormMessage(t("Network error"));
    } finally {
      setResending(false);
    }
  };

  const showResendButton = mainTimerExpired && resendCooldown <= 0;

  return (
    <Form {...form}>
      <div className="w-full">
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full space-y-12"
        >
          <div dir="ltr" className="grid grid-cols-1 gap-4">
            <div className="flex items-center justify-center">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <InputOTP maxLength={6} {...field}>
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                        </InputOTPGroup>
                        <InputOTPSeparator />
                        <InputOTPGroup>
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-3">
            {formMessage && (
              <div
                role="alert"
                className="flex w-full items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-700"
              >
                <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                <span>{formMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || mainTimerExpired}
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
                <ShieldCheck className="h-4 w-4" />
              )}
              <span>{submitting ? t("Sending") : t("Confirm Code Button")}</span>
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

            {resendCooldown > 0 && (
              <p className="text-[12.5px] text-[#6b6256]">
                {t("You can retry after")}{" "}
                <span className="font-semibold tabular-nums text-[#082F18]">
                  {formatTime(resendCooldown)}
                </span>
              </p>
            )}

            {showResendButton && (
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={resending}
                className={cn(
                  "inline-flex items-center justify-center gap-2 text-[12.5px] font-semibold text-[#082F18] hover:underline",
                  "disabled:cursor-not-allowed disabled:opacity-60"
                )}
              >
                {resending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{resending ? t("Sending") : t("Resend Code")}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </Form>
  );
}

export default FormComponent;
