import { Locale } from "src/i18n/routing";

export type LocaleParams = Promise<{
  locale: Locale;
}>;
