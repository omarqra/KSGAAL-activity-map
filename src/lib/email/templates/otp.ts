import { BRAND_COLORS, emailLayout, escapeHtml } from "./layout";

export function otpEmail({
  name,
  code,
  expiresInMinutes,
}: {
  name: string | null;
  code: string;
  expiresInMinutes: number;
}): { subject: string; html: string } {
  const subject = "رمز التحقق لتسجيل الدخول";
  const greeting = name ? `مرحباً ${escapeHtml(name)}،` : "مرحباً،";

  const codeBox = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
           style="margin:18px 0 22px 0;">
      <tr>
        <td align="center"
            style="padding:18px 16px;background-color:${BRAND_COLORS.bgCream};
                   border:1px solid ${BRAND_COLORS.borderSoft};border-radius:6px;
                   font-family:'Courier New',Courier,monospace;font-size:30px;
                   font-weight:bold;letter-spacing:10px;color:${BRAND_COLORS.deepGreen};
                   direction:ltr;">
          ${escapeHtml(code)}
        </td>
      </tr>
    </table>`;

  const html = emailLayout({
    title: subject,
    subtitle: "أدخل هذا الرمز في الصفحة لإكمال تسجيل الدخول",
    bodyHtml: `
      <p style="margin:0 0 12px 0;">${greeting}</p>
      <p style="margin:0 0 8px 0;">رمز التحقق الخاص بك هو:</p>
      ${codeBox}
      <p style="margin:0 0 6px 0;">
        صالح لمدة <b style="color:${BRAND_COLORS.deepGreen};">${expiresInMinutes}</b> دقائق فقط.
      </p>
      <p style="margin:18px 0 0 0;color:${BRAND_COLORS.textMuted};font-size:12.5px;">
        إذا لم تطلب هذا الرمز، تجاهل هذه الرسالة وغيّر كلمة المرور فوراً للحفاظ على أمان حسابك.
      </p>
    `,
  });
  return { subject, html };
}
