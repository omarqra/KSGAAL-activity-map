import { Metadata } from "next";

import { Link } from "@/i18n/routing";
import { LocaleParams } from "@/i18n/params";

import ResetPasswordForm from "./components/reset-password-form";

export const metadata: Metadata = {
  title: "إعادة تعيين كلمة المرور",
  description: "اختر كلمة مرور جديدة لحسابك",
};

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: LocaleParams;
  searchParams: Promise<{ token?: string }>;
}) {
  const { locale } = await params;
  const { token } = await searchParams;
  const isAr = locale === "ar";

  return (
    <main
      dir={isAr ? "rtl" : "ltr"}
      className="relative min-h-svh overflow-hidden bg-[#faf7ee]"
    >
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5 sm:px-10">
        <Link
          href="/auth/login"
          locale={locale}
          className="text-[12px] font-semibold text-[#082F18] hover:underline"
        >
          {isAr ? "← العودة لتسجيل الدخول" : "← Back to login"}
        </Link>
      </header>

      <section className="relative z-10 mx-auto flex w-full max-w-md flex-col items-center px-6 pt-6 pb-10 sm:pt-10">
        <h1 className="text-center text-[26px] leading-tight font-bold text-[#082F18] sm:text-[30px]">
          {isAr ? "إعادة تعيين كلمة المرور" : "Reset password"}
        </h1>
        <p className="mt-2 max-w-sm text-center text-[13.5px] leading-relaxed text-[#6b6256]">
          {isAr
            ? "اختر كلمة مرور جديدة قوية. سيتم إنهاء جميع الجلسات الأخرى."
            : "Choose a new strong password. All other sessions will be ended."}
        </p>

        <div className="relative mt-7 w-full">
          <span className="absolute start-6 -top-px h-[2px] w-12 bg-[#082F18]" />
          <span className="absolute end-6 -top-px h-[2px] w-12 bg-[#D56028]" />
          <div className="rounded-md border border-[#e7e0cc] bg-white px-6 py-7 shadow-[0_1px_2px_0_rgba(13,68,41,0.04),0_12px_28px_-14px_rgba(13,68,41,0.18)] sm:px-8">
            {token ? (
              <ResetPasswordForm locale={locale} token={token} />
            ) : (
              <p className="text-center text-[13.5px] text-rose-600">
                {isAr
                  ? "الرابط غير صالح أو منتهي الصلاحية. اطلب رابطاً جديداً."
                  : "Link is invalid or expired. Please request a new one."}
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
