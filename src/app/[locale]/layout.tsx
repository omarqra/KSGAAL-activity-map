import type { Metadata } from "next";
import localFont from "next/font/local";
import { notFound } from "next/navigation";

import { getMessages } from "next-intl/server";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ProgressBarProvider } from "react-transition-progress";
import { z } from "zod";

import { ConfirmDialogProvider } from "@/components/dialog";
import { FontSync } from "@/components/font-sync";
import { Toaster } from "@/components/ui/sonner";
import { env } from "@/env/client";
import IntlClientProvider from "@/i18n/intl-client-provider";

import "../globals.css";

const CairoFont = localFont({
  src: "../fonts/Cairo-Variable.ttf",
  variable: "--font-cairo",
});

const MajallaFont = localFont({
  src: "../../font/majalla.ttf",
  variable: "--font-majalla",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Dashboard",
    template: "%s | Dashboard",
  },
  alternates: {
    canonical: env.NEXT_PUBLIC_FRONTEND_URL,
    languages: {
      en: `${env.NEXT_PUBLIC_FRONTEND_URL}/en`,
      ar: `${env.NEXT_PUBLIC_FRONTEND_URL}/ar`,
    },
  },
  description: "Dashboard",
};

export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  const sanitizedLocale = z.enum(["ar", "en"]).safeParse(locale).data;
  if (!sanitizedLocale) notFound();
  const messages = await getMessages({
    locale: sanitizedLocale,
  });

  return (
    <html
      lang={sanitizedLocale}
      className="light"
      suppressHydrationWarning
      dir={sanitizedLocale === "ar" ? "rtl" : "ltr"}
    >
      <body
        className={`${MajallaFont.variable} ${CairoFont.variable} antialiased`}
      >
        <FontSync />
        <ConfirmDialogProvider>
          <NuqsAdapter>
            <IntlClientProvider messages={messages} locale={sanitizedLocale}>
              <Toaster
                toastOptions={{
                  classNames: {
                    loading:
                      "bg-background! text-foreground! rounded-lg! shadow-lg! border-none!",
                    error:
                      "bg-destructive! !text-white rounded-lg! shadow-lg! border-none!",
                    success:
                      "bg-primary! text-primary-foreground! rounded-lg! shadow-lg! border-none!",
                    description: "text-foreground! rounded-lg! border-none!",
                    title: "rounded-lg! border-none!",
                    icon: "rounded-lg! border-none!",
                    warning:
                      "bg-yellow-500! text-yellow-900! rounded-lg! shadow-lg! border-none!",
                  },
                }}
              />

              <ProgressBarProvider>{children}</ProgressBarProvider>
            </IntlClientProvider>
          </NuqsAdapter>
        </ConfirmDialogProvider>
      </body>
    </html>
  );
}
