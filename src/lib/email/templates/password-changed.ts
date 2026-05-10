import { BRAND_COLORS, emailLayout, escapeHtml } from "./layout";

export function passwordChangedEmail({
  name,
  email,
}: {
  name: string | null;
  email: string;
}): { subject: string; html: string } {
  const subject = "تم تغيير كلمة المرور";
  const greeting = name ? `مرحباً ${escapeHtml(name)}،` : "مرحباً،";
  const when = new Date().toLocaleString("ar-SA", {
    timeZone: "Asia/Riyadh",
    dateStyle: "long",
    timeStyle: "short",
  });

  const warningCallout = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
           style="margin:18px 0;">
      <tr>
        <td dir="rtl" align="right"
            style="padding:14px 16px;background-color:#FFF7ED;
                   border:1px solid #F5CC44;border-right:4px solid #D56028;
                   border-radius:6px;color:#82400A;font-size:13px;line-height:1.7;">
          <b style="display:block;margin-bottom:4px;">إذا لم تكن أنت من قام بهذا الإجراء:</b>
          تواصل مع فريق الدعم فوراً وأعد تعيين كلمة المرور من جديد.
        </td>
      </tr>
    </table>`;

  const html = emailLayout({
    title: subject,
    subtitle: "تنبيه أمني — تم تغيير كلمة مرور حسابك",
    bodyHtml: `
      <p style="margin:0 0 12px 0;">${greeting}</p>
      <p style="margin:0 0 14px 0;">
        نُعلمك بأنه تم تغيير كلمة المرور الخاصة بحسابك:
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
             style="margin:6px 0 14px 0;">
        <tr>
          <td dir="rtl" align="right"
              style="padding:12px 14px;background-color:${BRAND_COLORS.bgCream};
                     border:1px solid ${BRAND_COLORS.borderSoft};border-radius:6px;
                     font-size:13px;line-height:1.9;color:${BRAND_COLORS.textBody};">
            <div><b style="color:${BRAND_COLORS.deepGreen};">البريد:</b>
              <span dir="ltr">${escapeHtml(email)}</span>
            </div>
            <div><b style="color:${BRAND_COLORS.deepGreen};">التاريخ والوقت:</b>
              ${escapeHtml(when)}
            </div>
          </td>
        </tr>
      </table>
      ${warningCallout}
      <p style="margin:14px 0 0 0;color:${BRAND_COLORS.textMuted};font-size:12.5px;">
        لأسباب أمنية، لا نُرسل أبداً كلمات المرور عبر البريد الإلكتروني.
      </p>
    `,
  });
  return { subject, html };
}
