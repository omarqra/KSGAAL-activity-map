"use server";

import { loadLocaleMessages } from "src/i18n/load-locale-messages";
import type { Locale } from "src/i18n/routing";
import { routing } from "src/i18n/routing";

export async function getMessages(locale: Locale) {
  if (!routing.locales.includes(locale)) {
    locale = routing.defaultLocale;
  }

  return await loadLocaleMessages(locale);
}
