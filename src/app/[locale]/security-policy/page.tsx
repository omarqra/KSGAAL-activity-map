/* eslint-disable max-lines */
import { Metadata } from "next";
import Image from "next/image";

import { ShieldCheck } from "lucide-react";

import { Link } from "@/i18n/routing";
import { LocaleParams } from "@/i18n/params";

export const metadata: Metadata = {
  title: "سياسة الاستخدام الآمن",
  description: "وحدة التحكم — سياسة الاستخدام الآمن للمستخدمين",
};

const LAST_UPDATED_AR = "10 مايو 2026";
const LAST_UPDATED_EN = "May 10, 2026";

interface Section {
  id: string;
  heading: string;
  body?: string;
  items?: string[];
  ordered?: boolean;
}

export default async function SecurityPolicyPage({
  params,
}: {
  params: LocaleParams;
}) {
  const { locale } = await params;
  const isAr = locale === "ar";
  const otherLocale = isAr ? "en" : "ar";

  const sections: Section[] = isAr
    ? [
        {
          id: "intro",
          heading: "المقدمة",
          body: "تهدف هذه السياسة إلى توضيح القواعد والإرشادات الواجب على جميع المستخدمين الالتزام بها عند استخدام تطبيق المتصفح الخاص بنظام إدارة الأنشطة، وذلك لضمان حماية بياناتك وبيانات المؤسسة من الوصول غير المصرّح به أو الاستخدام السيّئ. الالتزام بهذه السياسة شرط أساسي لاستخدام النظام.",
        },
        {
          id: "acceptable-use",
          heading: "الاستخدام المقبول",
          items: [
            "استخدم كلمة مرور قوية وفريدة لا تستعملها في أي خدمة أخرى.",
            "لا تشارك بيانات الدخول (اسم المستخدم/كلمة المرور/رمز التحقق) مع أي شخص مهما كانت صفته.",
            "فعّل المصادقة الثنائية (MFA) دائماً، فهي إلزامية للوصول إلى النظام.",
            "سجّل الخروج عند الانتهاء، خصوصاً على الأجهزة المشتركة أو العامة.",
            "تأكد من أن متصفحك ونظام التشغيل محدّثان دائماً.",
          ],
        },
        {
          id: "password",
          heading: "حماية كلمة المرور",
          body: "يفرض النظام متطلبات صارمة على كلمات المرور لضمان قوّتها: حدّ أدنى 8 أحرف، وحرف كبير (A-Z) وحرف صغير (a-z)، ورقم (0-9)، ورمز خاص (! @ # $ %).",
          items: [
            "يُخزّن النظام كلمات المرور بصيغة مُجَزّأة (hashed) باستخدام خوارزمية bcrypt بمعامل تكلفة قدره 12.",
            "لا يمكن استرجاع كلمة المرور الأصلية أبداً، حتى من قِبل مسؤول النظام.",
            "إذا اشتبهت في أن كلمة المرور قد تُسرّبت، غيّرها فوراً عبر صفحة “نسيت كلمة المرور” وأبلغ فريق الدعم.",
          ],
        },
        {
          id: "mfa",
          heading: "المصادقة الثنائية (MFA)",
          body: "بعد إدخال اسم المستخدم وكلمة المرور بنجاح، يرسل النظام رمز تحقق لمرّة واحدة (OTP) إلى بريدك الإلكتروني المسجّل.",
          items: [
            "صلاحية الرمز 10 دقائق فقط من وقت الإرسال.",
            "مسموح بـ 5 محاولات إدخال خاطئة كحدّ أقصى قبل قفل المحاولة.",
            "لا تشارك الرمز أبداً، فالنظام لن يطلبه منك عبر الهاتف أو البريد.",
            "المصادقة الثنائية إلزامية لأنها تحمي حسابك حتى في حال تسرّبت كلمة المرور.",
          ],
        },
        {
          id: "sessions",
          heading: "الجلسات",
          items: [
            "مدّة الجلسة الافتراضية 7 أيام، تنتهي بعدها تلقائياً وتحتاج إلى إعادة تسجيل الدخول.",
            "يمكنك تسجيل الخروج يدوياً في أي وقت من القائمة العلوية.",
            "تُلغى الجلسة تلقائياً عند تغيير كلمة المرور أو تعطيل الحساب من قِبل المسؤول.",
          ],
        },
        {
          id: "incident",
          heading: "الإبلاغ عن الحوادث الأمنية",
          body: "إذا لاحظت أي نشاط مشبوه على حسابك (محاولات دخول لم تقم بها، رسائل OTP لم تطلبها، تغيير في بياناتك)، اتخذ الخطوات التالية فوراً:",
          ordered: true,
          items: [
            "غيّر كلمة المرور من صفحة “نسيت كلمة المرور”.",
            "سجّل الخروج من جميع الأجهزة.",
          ],
        },
      ]
    : [
        {
          id: "intro",
          heading: "Introduction",
          body: "This policy outlines the rules and guidelines that all users must follow when using the activity management browser application, to ensure that your data and the organization's data are protected from unauthorized access or misuse. Compliance with this policy is a mandatory condition for using the system.",
        },
        {
          id: "acceptable-use",
          heading: "Acceptable Use",
          items: [
            "Use a strong, unique password that you do not reuse on any other service.",
            "Never share your credentials (username, password, or one-time code) with anyone, regardless of their role.",
            "Always enable two-factor authentication (MFA); it is mandatory to access the system.",
            "Log out when you finish, especially on shared or public devices.",
            "Keep your browser and operating system up to date at all times.",
          ],
        },
        {
          id: "password",
          heading: "Password Protection",
          body: "The system enforces strict password requirements: at least 8 characters, including one uppercase letter (A-Z), one lowercase letter (a-z), one digit (0-9), and one special symbol (! @ # $ %).",
          items: [
            "Passwords are stored hashed using bcrypt with a cost factor of 12.",
            "The original password can never be recovered — not even by a system administrator.",
            "If you suspect your password is compromised, change it immediately via the “Forgot Password” page and notify support.",
          ],
        },
        {
          id: "mfa",
          heading: "Two-Factor Authentication (MFA)",
          body: "After you successfully enter your username and password, the system sends a one-time passcode (OTP) to your registered email.",
          items: [
            "The code is valid for 10 minutes only from the time of issuance.",
            "A maximum of 5 incorrect attempts is allowed before the attempt is locked.",
            "Never share the code; the system will never ask you for it by phone or email.",
            "MFA is mandatory because it protects your account even if your password is leaked.",
          ],
        },
        {
          id: "sessions",
          heading: "Sessions",
          items: [
            "The default session duration is 7 days, after which it expires automatically and you must sign in again.",
            "You can log out manually at any time via the top menu.",
            "The session is automatically invalidated when your password is changed or when your account is disabled by an administrator.",
          ],
        },
        {
          id: "incident",
          heading: "Incident Reporting",
          body: "If you notice any suspicious activity on your account (login attempts you did not make, OTP messages you did not request, or changes to your data), take the following steps immediately:",
          ordered: true,
          items: [
            "Change your password from the “Forgot Password” page.",
            "Log out from all your devices.",
          ],
        },
      ];

  const eyebrow = isAr ? "سياسة الاستخدام الآمن" : "Secure Usage Policy";
  const title = isAr
    ? "سياسة الاستخدام الآمن للمستخدمين"
    : "Secure Usage Policy for Users";
  const introLine = isAr
    ? "إرشادات وقواعد لحماية حسابك وبيانات المؤسسة عند استخدام تطبيق المتصفح."
    : "Guidelines and rules for protecting your account and the organization's data when using the browser app.";
  const lastUpdatedLabel = isAr ? "آخر تحديث:" : "Last updated:";
  const lastUpdatedDate = isAr ? LAST_UPDATED_AR : LAST_UPDATED_EN;
  const backLabel = isAr ? "← العودة لتسجيل الدخول" : "← Back to login";
  const langLabel = isAr ? "الإنجليزية" : "Arabic";
  const footerNotice = isAr
    ? "© مجمع الملك سلمان العالمي للغة العربية — جميع الحقوق محفوظة."
    : "© King Salman Global Academy for Arabic Language — All rights reserved.";

  return (
    <main
      dir={isAr ? "rtl" : "ltr"}
      className="relative min-h-svh overflow-hidden bg-[#faf7ee]"
    >
      {/* Decorative dot grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(#082F18 0.5px, transparent 0.5px)",
          backgroundSize: "22px 22px",
          maskImage:
            "radial-gradient(ellipse at top, black 20%, transparent 70%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at top, black 20%, transparent 70%)",
        }}
      />

      {/* Top bar */}
      <header className="relative z-10 mx-auto flex max-w-3xl items-center justify-between px-6 py-5 sm:px-10">
        <Link
          href={"/auth/login" as never}
          locale={locale}
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#082F18] hover:underline"
        >
          <span>{backLabel}</span>
        </Link>

        <Link
          href={"/security-policy" as never}
          locale={otherLocale}
          className="inline-flex items-center gap-2 rounded-full border border-[#d8d2c2] bg-white/80 px-3.5 py-1.5 text-[12px] font-semibold text-[#082F18] backdrop-blur-sm transition-colors hover:bg-white"
        >
          <Image
            src="/icons/lang.png"
            alt=""
            width={16}
            height={16}
            className="h-4 w-4"
          />
          {langLabel}
        </Link>
      </header>

      {/* Content */}
      <article className="relative z-10 mx-auto w-full max-w-3xl px-6 pt-4 pb-16 sm:px-10">
        {/* Title block */}
        <div className="relative">
          <span className="absolute start-0 -top-px h-[2px] w-16 bg-[#082F18]" />
          <span className="absolute start-20 -top-px h-[2px] w-12 bg-[#D56028]" />

          <p className="pt-5 text-[12px] font-semibold tracking-[0.18em] text-[#024E28] uppercase">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-[28px] leading-tight font-bold text-[#082F18] sm:text-[32px]">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-[14.5px] leading-[1.7] text-[#5b5346]">
            {introLine}
          </p>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#e7e0cc] bg-white/80 px-3 py-1 text-[11.5px] text-[#6b6256]">
            <ShieldCheck className="h-3.5 w-3.5 text-[#024E28]" />
            <span>
              {lastUpdatedLabel}{" "}
              <span className="num font-semibold text-[#082F18]">
                {lastUpdatedDate}
              </span>
            </span>
          </div>
        </div>

        {/* Sections */}
        <div className="mt-10 space-y-8">
          {sections.map((section, idx) => (
            <section
              key={section.id}
              className="rounded-md border border-[#e7e0cc] bg-white px-6 py-6 shadow-[0_1px_2px_0_rgba(13,68,41,0.04),0_8px_22px_-16px_rgba(13,68,41,0.16)] sm:px-8"
            >
              <div className="flex items-baseline gap-3">
                <span className="num inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#082F18] text-[12px] font-bold text-[#faf7ee]">
                  {idx + 1}
                </span>
                <h2 className="text-[18px] font-semibold text-[#082F18] sm:text-[20px]">
                  {section.heading}
                </h2>
              </div>

              {section.body && (
                <p className="mt-3 ps-10 text-[14.5px] leading-[1.75] text-[#3d362c]">
                  {section.body}
                </p>
              )}

              {section.items && section.items.length > 0 && (
                section.ordered ? (
                  <ol className="mt-4 list-decimal space-y-2 ps-14 text-[14.5px] leading-[1.7] text-[#3d362c] marker:font-semibold marker:text-[#D56028]">
                    {section.items.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ol>
                ) : (
                  <ul className="mt-4 space-y-2.5 ps-14 text-[14.5px] leading-[1.7] text-[#3d362c]">
                    {section.items.map((item, i) => (
                      <li key={i} className="relative">
                        <span
                          className="absolute -inset-s-5 top-2 h-1.5 w-1.5 rounded-full bg-[#024E28]"
                          aria-hidden
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                )
              )}
            </section>
          ))}

          {/* Last updated callout */}
          <section className="rounded-md border border-[#024E28]/25 bg-[#024E28]/4 px-6 py-5 sm:px-8">
            <h3 className="text-[15px] font-semibold text-[#082F18]">
              {isAr ? "آخر تحديث" : "Last Updated"}
            </h3>
            <p className="mt-1.5 text-[13.5px] leading-[1.7] text-[#3d362c]">
              {isAr
                ? `تم تحديث هذه السياسة بتاريخ ${LAST_UPDATED_AR}. قد تُراجَع وتُحدَّث دورياً، ويُعتبر استمرارك في استخدام النظام موافقةً على أحدث نسخة منها.`
                : `This policy was last updated on ${LAST_UPDATED_EN}. It may be reviewed and updated periodically; your continued use of the system constitutes acceptance of its latest version.`}
            </p>
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-12 flex flex-col items-center justify-center gap-2 border-t border-[#e7e0cc] pt-6 text-[11.5px] text-[#9c9382]">
          <span>{footerNotice}</span>
        </footer>
      </article>
    </main>
  );
}
