import { Locale } from "next-intl";

// type LocaleMessages = {
//   [key: string]: string | LocaleMessages;
// };

export async function loadLocaleMessages(locale: Locale) {
  // const dirPath = path.join(process.cwd(), "src", "i18n", "messages", locale);
  // const messages: LocaleMessages = {};

  // let content: LocaleMessages = {};
  // try {
  //   const files = fs.readdirSync(dirPath);

  //   for (const file of files) {
  //     if (file.endsWith(".json")) {
  //       const filePath = path.join(dirPath, file);

  //       const fileNameWithoutExt = path.basename(file, ".json");
  //       const fileContent = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  //       if (fileNameWithoutExt === locale) {
  //         content = { ...content, ...fileContent };
  //       } else {
  //         content[fileNameWithoutExt] = fileContent;
  //       }

  //       Object.assign(messages, content);
  //     }
  //   }
  // } catch (error) {
  //   console.error(`[i18n] Failed to load messages for "${locale}":`, error);
  // }

  return (await import(`@/i18n/messages/${locale}.json`)).default;
}
