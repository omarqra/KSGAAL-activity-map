import { headers } from "next/headers";

import { ThemeInitializer } from "@/components/theme-insure-component";

// ? this is new file from next.js
// ! before edit see https://nextjs.org/docs/app/api-reference/file-conventions/not-found#global-not-foundjs-experimental
export default async function NotFound() {
  const headersList = await headers();
  const referer = headersList.get("referer") || "";
  const acceptLanguage = headersList.get("accept-language") || "";
  const locale =
    referer.includes("/ar") || acceptLanguage.startsWith("ar") ? "ar" : "en";

  const content = {
    en: {
      title: "404",
      heading: "Page Not Found",
      description:
        "We're sorry, but the page you are looking for cannot be found. It may have been moved, deleted, or the URL might be incorrect. Please check the address you entered or return to the homepage to continue browsing our website.",
      button: "Return to Homepage",
    },
    ar: {
      title: "404",
      heading: "الصفحة غير موجودة",
      description:
        "نأسف، لكن الصفحة التي تبحث عنها غير موجودة. قد تكون تم نقلها أو حذفها، أو قد يكون الرابط غير صحيح. يرجى التحقق من العنوان الذي أدخلته أو العودة إلى الصفحة الرئيسية لمتابعة تصفح الموقع.",
      button: "العودة إلى الصفحة الرئيسية",
    },
  };

  const text = content[locale as keyof typeof content] || content.en;

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <body
        style={{
          margin: 0,
          padding: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <ThemeInitializer />
        <div
          style={{ textAlign: "center", maxWidth: "600px", padding: "2rem" }}
        >
          <h1 style={{ fontSize: "4rem", margin: 0, fontWeight: 700 }}>
            {text.title}
          </h1>
          <h2 style={{ fontSize: "1.5rem", margin: "1rem 0", fontWeight: 600 }}>
            {text.heading}
          </h2>
          <p
            style={{
              fontSize: "1rem",
              margin: "1.5rem 0",
              color: "#666",
              lineHeight: "1.6",
            }}
          >
            {text.description}
          </p>
          <a
            href={locale === "ar" ? "/ar" : "/en"}
            style={{
              display: "inline-block",
              marginTop: "1rem",
              padding: "0.75rem 1.5rem",
              backgroundColor: "#000",
              color: "#fff",
              textDecoration: "none",
              borderRadius: "4px",
              fontSize: "1rem",
            }}
          >
            {text.button}
          </a>
        </div>
      </body>
    </html>
  );
}
