/**
 * Brand email layout — survives dark-mode email clients (Outlook, Gmail iOS,
 * Apple Mail) which often invert colors regardless of `color-scheme` meta.
 *
 * Survival strategy:
 *   • `bgcolor` HTML attribute on EVERY cell (Outlook honors this even when
 *     it strips/inverts CSS background-color)
 *   • `mso-` conditional comments that re-assert backgrounds for the Outlook
 *     desktop Word engine
 *   • Explicit text colors on every text node so dark-mode clients can't
 *     "auto-invert" to dark text on dark background
 *   • Logo wrapped in an extra-strong white pill (border + bgcolor + style)
 *
 * Visual identity matches the login page: cream background, white card,
 * green/orange ribbon stripes, Tahoma + Arial typography, KSGA logo via CID.
 */

const BRAND = {
  deepGreen: "#082F18",
  primaryGreen: "#024E28",
  accentOrange: "#D56028",
  bgCream: "#FAF7EE",
  cardWhite: "#FFFFFF",
  textBody: "#1A1A1A",
  textMuted: "#6B6256",
  borderSoft: "#E7E0CC",
};

const ACADEMY_AR = "مجمع الملك سلمان العالمي للغة العربية";

export type EmailLayoutInput = {
  title: string;
  bodyHtml: string;
  cta?: { label: string; url: string };
  subtitle?: string;
};

export function emailLayout({
  title,
  bodyHtml,
  cta,
  subtitle,
}: EmailLayoutInput): string {
  const ctaBlock = cta
    ? `
        <tr>
          <td align="center" bgcolor="${BRAND.cardWhite}"
              style="padding:8px 32px 24px 32px;background-color:${BRAND.cardWhite};">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td bgcolor="${BRAND.deepGreen}" style="border-radius:6px;background-color:${BRAND.deepGreen};">
                  <a href="${escapeHtml(cta.url)}"
                     style="display:inline-block;padding:13px 30px;font-family:Tahoma,Arial,sans-serif;
                            font-size:14px;font-weight:bold;color:#FFFFFF !important;text-decoration:none;
                            border-radius:6px;background-color:${BRAND.deepGreen};
                            mso-padding-alt:13px 30px;">
                    <span style="color:#FFFFFF !important;">${escapeHtml(cta.label)}</span>
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>`
    : "";

  const subtitleBlock = subtitle
    ? `
        <tr>
          <td align="center" bgcolor="${BRAND.cardWhite}"
              style="padding:0 32px 4px 32px;background-color:${BRAND.cardWhite};">
            <div style="font-family:Tahoma,Arial,sans-serif;font-size:13px;line-height:1.7;
                        color:${BRAND.textMuted};">
              ${escapeHtml(subtitle)}
            </div>
          </td>
        </tr>`
    : "";

  return `<!doctype html>
<html lang="ar" dir="rtl" xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="color-scheme" content="light only" />
    <meta name="supported-color-schemes" content="light only" />
    <title>${escapeHtml(title)}</title>
    <!--[if mso]>
    <style type="text/css">
      table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
      .mso-fallback { font-family: Tahoma, Arial, sans-serif !important; }
    </style>
    <![endif]-->
    <style>
      /* Defeat Gmail / Apple Mail dark-mode auto-inversion */
      :root { color-scheme: light only; supported-color-schemes: light only; }
      [data-ogsc] body, [data-ogsc] table, [data-ogsc] td { color-scheme: light only !important; }
      u + .body .force-light { background-color: #FAF7EE !important; }
      u + .body .force-card  { background-color: #FFFFFF !important; }
      u + .body .force-text  { color: #1A1A1A !important; }
    </style>
  </head>
  <body class="body" bgcolor="${BRAND.bgCream}"
        style="margin:0;padding:0;background-color:${BRAND.bgCream};
               font-family:Tahoma,Arial,sans-serif;color:${BRAND.textBody};
               -webkit-text-size-adjust:none;">

    <!-- Hidden preheader (improves inbox preview) -->
    <div style="display:none;font-size:1px;color:${BRAND.bgCream};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
      ${escapeHtml(title)}
    </div>

    <!-- Wrapper -->
    <table role="presentation" class="force-light" width="100%" cellpadding="0" cellspacing="0" border="0"
           bgcolor="${BRAND.bgCream}"
           style="background-color:${BRAND.bgCream};padding:36px 12px;">
      <tr>
        <td align="center" bgcolor="${BRAND.bgCream}" style="background-color:${BRAND.bgCream};">

          <!-- Top brand strip (academy name above the card) -->
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
                 style="width:600px;max-width:600px;margin-bottom:14px;">
            <tr>
              <td dir="rtl" align="center"
                  style="font-family:Tahoma,Arial,sans-serif;font-size:11px;
                         color:${BRAND.textMuted};letter-spacing:3px;">
                <span style="color:${BRAND.textMuted};">${escapeHtml(ACADEMY_AR)}</span>
              </td>
            </tr>
          </table>

          <!-- Card -->
          <table role="presentation" class="force-card" width="600" cellpadding="0" cellspacing="0" border="0"
                 bgcolor="${BRAND.cardWhite}"
                 style="width:600px;max-width:600px;background-color:${BRAND.cardWhite};
                        border:1px solid ${BRAND.borderSoft};border-radius:8px;
                        border-collapse:separate;
                        box-shadow:0 12px 28px -14px rgba(13,68,41,0.18);">

            <!-- Ribbon corners (login-card style) -->
            <tr>
              <td bgcolor="${BRAND.cardWhite}" style="padding:0;line-height:0;font-size:0;background-color:${BRAND.cardWhite};">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${BRAND.cardWhite}">
                  <tr>
                    <td bgcolor="${BRAND.cardWhite}" style="width:24px;line-height:2px;font-size:0;background-color:${BRAND.cardWhite};">&nbsp;</td>
                    <td bgcolor="${BRAND.deepGreen}" style="height:2px;line-height:2px;font-size:0;width:48px;background-color:${BRAND.deepGreen};">&nbsp;</td>
                    <td bgcolor="${BRAND.cardWhite}" style="line-height:2px;font-size:0;background-color:${BRAND.cardWhite};">&nbsp;</td>
                    <td bgcolor="${BRAND.accentOrange}" style="height:2px;line-height:2px;font-size:0;width:48px;background-color:${BRAND.accentOrange};">&nbsp;</td>
                    <td bgcolor="${BRAND.cardWhite}" style="width:24px;line-height:2px;font-size:0;background-color:${BRAND.cardWhite};">&nbsp;</td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Logo pill (deep-green background — visible in light AND dark clients) -->
            <tr>
              <td align="center" bgcolor="${BRAND.cardWhite}"
                  style="padding:32px 28px 8px 28px;background-color:${BRAND.cardWhite};">
                <!--[if mso]>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" bgcolor="${BRAND.deepGreen}" style="background-color:${BRAND.deepGreen};border-radius:10px;">
                <tr><td bgcolor="${BRAND.deepGreen}" style="padding:22px 32px;background-color:${BRAND.deepGreen};">
                <![endif]-->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0"
                       bgcolor="${BRAND.deepGreen}"
                       style="background-color:${BRAND.deepGreen};border-radius:10px;">
                  <tr>
                    <td bgcolor="${BRAND.deepGreen}" align="center"
                        style="padding:22px 32px;background-color:${BRAND.deepGreen};
                               border-radius:10px;line-height:0;mso-padding-alt:22px 32px;">
                      <img src="cid:brand-logo" width="220" height="auto" alt=""
                           style="display:block;width:220px;max-width:220px;height:auto;
                                  border:0;outline:none;text-decoration:none;" />
                    </td>
                  </tr>
                </table>
                <!--[if mso]>
                </td></tr></table>
                <![endif]-->
              </td>
            </tr>

            <!-- Title -->
            <tr>
              <td align="center" bgcolor="${BRAND.cardWhite}"
                  style="padding:18px 28px 6px 28px;background-color:${BRAND.cardWhite};">
                <div class="mso-fallback"
                     style="font-family:Tahoma,Arial,sans-serif;font-size:22px;font-weight:bold;
                            color:${BRAND.deepGreen};line-height:1.4;">
                  <span style="color:${BRAND.deepGreen};">${escapeHtml(title)}</span>
                </div>
              </td>
            </tr>

            ${subtitleBlock}

            <!-- Decorative divider -->
            <tr>
              <td align="center" bgcolor="${BRAND.cardWhite}"
                  style="padding:14px 28px 18px 28px;background-color:${BRAND.cardWhite};">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" bgcolor="${BRAND.cardWhite}">
                  <tr>
                    <td bgcolor="${BRAND.deepGreen}" style="width:36px;height:2px;line-height:2px;font-size:0;background-color:${BRAND.deepGreen};">&nbsp;</td>
                    <td bgcolor="${BRAND.cardWhite}" style="width:8px;line-height:2px;font-size:0;background-color:${BRAND.cardWhite};">&nbsp;</td>
                    <td bgcolor="${BRAND.accentOrange}" style="width:36px;height:2px;line-height:2px;font-size:0;background-color:${BRAND.accentOrange};">&nbsp;</td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td dir="rtl" align="right" bgcolor="${BRAND.cardWhite}"
                  class="force-text"
                  style="padding:0 32px 24px 32px;background-color:${BRAND.cardWhite};
                         font-family:Tahoma,Arial,sans-serif;font-size:14px;line-height:1.85;
                         color:${BRAND.textBody};">
                ${bodyHtml}
              </td>
            </tr>

            ${ctaBlock}

            <!-- Secure-connection note -->
            <tr>
              <td dir="rtl" align="center" bgcolor="${BRAND.cardWhite}"
                  style="padding:0 32px 22px 32px;background-color:${BRAND.cardWhite};
                         font-family:Tahoma,Arial,sans-serif;font-size:11.5px;color:${BRAND.textMuted};">
                <span style="color:${BRAND.deepGreen};font-weight:bold;">●</span>
                <span style="color:${BRAND.textMuted};">&nbsp; اتصال آمن ومُشفّر</span>
              </td>
            </tr>

          </table>
          <!-- /Card -->

          <!-- Footer -->
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
                 style="width:600px;max-width:600px;margin-top:18px;">
            <tr>
              <td dir="rtl" align="center"
                  style="font-family:Tahoma,Arial,sans-serif;font-size:11px;line-height:1.8;
                         color:${BRAND.textMuted};">
                <span style="color:${BRAND.textMuted};">هذه رسالة آلية &mdash; يرجى عدم الردّ عليها.</span><br />
                <span style="color:${BRAND.deepGreen};letter-spacing:2px;">${escapeHtml(ACADEMY_AR)}</span>
              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>
    <!-- /Wrapper -->
  </body>
</html>`;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const BRAND_COLORS = BRAND;
