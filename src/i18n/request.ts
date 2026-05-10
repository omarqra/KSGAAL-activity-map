import { getRequestConfig } from "next-intl/server";

import { loadLocaleMessages } from "./load-locale-messages";
import { Locale, routing } from "./routing";

export default getRequestConfig(
  // @ts-expect-error - requestLocale is not typed
  async ({ requestLocale }: { requestLocale: Promise<Locale> }) => {
    // This typically corresponds to the `[locale]` segment
    let locale = await requestLocale;

    // Ensure that a valid locale is used
    if (!locale || !routing.locales.includes(locale)) {
      locale = routing.defaultLocale;
    }

    const messages = await loadLocaleMessages(locale);

    return {
      locale,
      messages,
      getMessageFallback({ key }) {
        const splitted = key.split(".");
        return splitted[splitted.length - 1];
      },
      onError(error) {
        if (error.code === "MISSING_MESSAGE") {
          return;
        } else {
          console.error(error);
        }
      },
      timeZone: "Asia/Riyadh",
    };
  }
);
