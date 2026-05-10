import { BRAND_COLORS, emailLayout, escapeHtml } from "./layout";

export function resetPasswordEmail({
  name,
  resetUrl,
  expiresInMinutes,
}: {
  name: string | null;
  resetUrl: string;
  expiresInMinutes: number;
}): { subject: string; html: string } {
  const subject = "إعادة تعيين كلمة المرور";
  const greeting = name ? `مرحباً ${escapeHtml(name)}،` : "مرحباً،";

  const html = emailLayout({
    title: subject,
    subtitle: "اضغط الزر أدناه لاختيار كلمة مرور جديدة لحسابك",
    cta: { label: "إعادة تعيين كلمة المرور", url: resetUrl },
    bodyHtml: `
      <p style="margin:0 0 12px 0;">${greeting}</p>
      <p style="margin:0 0 12px 0;">
        طلبت إعادة تعيين كلمة المرور لحسابك في منصة الإدارة. اضغط على الزر أدناه لاختيار كلمة مرور جديدة آمنة.
      </p>
      <p style="margin:14px 0 4px 0;font-size:12.5px;color:${BRAND_COLORS.textMuted};">
        أو انسخ الرابط التالي والصقه في المتصفح:
      </p>
      <p style="margin:0 0 12px 0;direction:ltr;text-align:left;word-break:break-all;
                font-size:12px;color:${BRAND_COLORS.primaryGreen};
                background-color:${BRAND_COLORS.bgCream};
                border:1px solid ${BRAND_COLORS.borderSoft};
                border-radius:4px;padding:10px 12px;">
        ${escapeHtml(resetUrl)}
      </p>
      <p style="margin:6px 0 0 0;">
        الرابط صالح لمدة <b style="color:${BRAND_COLORS.deepGreen};">${expiresInMinutes}</b> دقيقة فقط، ويُستخدم مرة واحدة.
      </p>
      <p style="margin:18px 0 0 0;color:${BRAND_COLORS.textMuted};font-size:12.5px;">
        إذا لم تطلب إعادة التعيين، يمكنك تجاهل هذه الرسالة بأمان — لن يتم أي تغيير على حسابك.
      </p>
    `,
  });
  return { subject, html };
}
