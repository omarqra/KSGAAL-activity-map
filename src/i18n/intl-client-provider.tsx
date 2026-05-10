"use client";

import { NextIntlClientProvider } from "next-intl";

const IntlClientProvider = ({
  messages,
  locale,
  children,
}: Parameters<typeof NextIntlClientProvider>[0]) => {
  return (
    <NextIntlClientProvider
      messages={messages}
      locale={locale}
      timeZone="Asia/Riyadh"
      // Prevents console errors for missing keys
      onError={(error) => {
        if (error.code === "MISSING_MESSAGE") {
          return;
        } else {
          console.error(error);
        }
      }}
      // return the translation key if not exist
      getMessageFallback={({ key }) => {
        if (!key) return "";
        const splitted = key.split(".");
        return splitted[splitted.length - 1];
      }}
    >
      {children}
    </NextIntlClientProvider>
  );
};

export default IntlClientProvider;
