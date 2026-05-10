const SUPPORT_PHONE_NUMBER = '966559656113'

export function contactWithSupportUrl(locale: string): string {
  const message = locale === "en" ? encodeURIComponent("Hello! I have a problem and need your help: ") : encodeURIComponent("السلام عليكم! لدي مشكلة واحتاج الى مساعدتكم :");
  const whatsappUrl = `https://wa.me/${SUPPORT_PHONE_NUMBER}?text=${message}`;

   return whatsappUrl
}
