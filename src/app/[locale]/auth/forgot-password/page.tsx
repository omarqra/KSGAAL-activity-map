import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { ShieldCheck } from "lucide-react";

import { Link as IntlLink } from "@/i18n/routing";
import { LocaleParams } from "@/i18n/params";

import ForgotPasswordForm from "./components/forgot-password-form";

export const metadata: Metadata = {
  title: "نسيت كلمة المرور",
  description: "إعادة تعيين كلمة المرور للوصول إلى وحدة التحكم",
};

export default async function ForgotPasswordPage({
  params,
}: {
  params: LocaleParams;
}) {
  const { locale } = await params;
  const isAr = locale === "ar";
  const otherLocale = isAr ? "en" : "ar";

  return (
    <main
      dir={isAr ? "rtl" : "ltr"}
      className="relative min-h-svh overflow-hidden bg-[#faf7ee]"
    >
      {/* Decorative watermark — large brand calligraphy */}
      <div
        className="pointer-events-none absolute inset-0 select-none"
        aria-hidden
      >
        <div className="absolute -end-24 -top-32 h-[520px] w-[520px] animate-[spin_80s_linear_infinite] opacity-[0.06] blur-[1px]">
          <Image
            src="/login/circle-of-letters.png"
            alt=""
            fill
            sizes="520px"
            className="object-contain"
          />
        </div>
        <div className="absolute -start-32 -bottom-40 h-[480px] w-[480px] animate-[spin_100s_linear_infinite] opacity-[0.05] blur-[1px]">
          <Image
            src="/login/circle-of-letters.png"
            alt=""
            fill
            sizes="480px"
            className="object-contain"
          />
        </div>

        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(#082F18 0.6px, transparent 0.6px)",
            backgroundSize: "22px 22px",
            maskImage:
              "radial-gradient(ellipse at center, black 30%, transparent 75%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          }}
        />
      </div>

      {/* Top bar */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5 sm:px-10">
        <Image
          src="/login/ksga-logo.png"
          alt={
            isAr
              ? "مجمع الملك سلمان العالمي للغة العربية"
              : "King Salman Global Academy for Arabic Language"
          }
          width={420}
          height={120}
          priority
          className="h-auto w-[180px] sm:w-[220px]"
        />

        <Link
          href={`/${otherLocale}/auth/forgot-password`}
          className="inline-flex items-center gap-2 rounded-full border border-[#d8d2c2] bg-white/80 px-3.5 py-1.5 text-[12px] font-semibold text-[#082F18] backdrop-blur-sm transition-colors hover:bg-white"
        >
          <Image
            src="/icons/lang.png"
            alt=""
            width={16}
            height={16}
            className="h-4 w-4"
          />
          {isAr ? "الإنجليزية" : "Arabic"}
        </Link>
      </header>

      {/* Center hero */}
      <section className="relative z-10 mx-auto flex w-full max-w-md flex-col items-center px-6 pt-6 pb-10 sm:pt-10">
        <h1 className="text-center text-[28px] leading-tight font-bold text-[#082F18] sm:text-[34px]">
          {isAr ? "نسيت كلمة المرور؟" : "Forgot password?"}
        </h1>
        <p className="mt-2 max-w-sm text-center text-[13.5px] leading-relaxed text-[#6b6256]">
          {isAr
            ? "أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور."
            : "Enter your email and we'll send you a link to reset your password."}
        </p>

        {/* Form card */}
        <div className="relative mt-7 w-full">
          {/* Decorative ribbon corners */}
          <span className="absolute start-6 -top-px h-[2px] w-12 bg-[#082F18]" />
          <span className="absolute end-6 -top-px h-[2px] w-12 bg-[#D56028]" />

          <div className="rounded-md border border-[#e7e0cc] bg-white px-6 py-7 shadow-[0_1px_2px_0_rgba(13,68,41,0.04),0_12px_28px_-14px_rgba(13,68,41,0.18)] sm:px-8">
            <ForgotPasswordForm locale={locale} />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4 text-[11.5px] text-[#6b6256]">
          <IntlLink
            href={"/auth/login" as never}
            locale={locale}
            className="font-semibold text-[#082F18] hover:underline"
          >
            {isAr ? "← العودة لتسجيل الدخول" : "← Back to login"}
          </IntlLink>
          <span aria-hidden className="text-[#d8d2c2]">·</span>
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-[#082F18]" />
            <span>
              {isAr
                ? "اتصال آمن ومُشفّر"
                : "Secure encrypted connection"}
            </span>
          </span>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 mx-auto max-w-6xl px-6 pb-6 sm:px-10">
        <div className="flex flex-col items-center justify-center gap-2 border-t border-[#e7e0cc] pt-4 text-[11px] text-[#9c9382]">
          <span dir="rtl" className="tracking-[0.25em]">
            مجمع الملك سلمان العالمي للغة العربية
          </span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden>·</span>
            <IntlLink
              href={"/security-policy" as never}
              locale={locale}
              className="font-semibold text-[#082F18] hover:underline"
            >
              {isAr ? "سياسة الاستخدام الآمن" : "Secure Usage Policy"}
            </IntlLink>
          </span>
        </div>
      </footer>
    </main>
  );
}
