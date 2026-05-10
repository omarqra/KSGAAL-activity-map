import path from "node:path";

import nodemailer, { type Transporter } from "nodemailer";

import { env } from "@/env/server";

let cached: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (cached) return cached;
  if (!env.SMTP_USER || !env.SMTP_PASS) return null;
  cached = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
  return cached;
}

export type EmailAttachment = {
  filename: string;
  /** Absolute path on disk OR a Buffer. */
  path?: string;
  content?: Buffer;
  /** Content-ID for inline embedding via <img src="cid:..." />. */
  cid?: string;
  contentType?: string;
};

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
};

/**
 * Returns the standard attachment set used by every transactional email
 * (currently the brand logo, referenced inline as `cid:logo`).
 *
 * Embedding the logo as a CID attachment instead of a remote URL makes it
 * render reliably in Outlook (which blocks remote images by default) and
 * Zoho (which strips some external assets).
 */
export function defaultBrandAttachments(): EmailAttachment[] {
  return [
    {
      filename: "logo.png",
      // White logo — paired with the deep-green pill background in the email
      // template so it stays visible in both light and dark mode clients.
      path: path.join(process.cwd(), "public", "globe", "logo.png"),
      cid: "brand-logo",
      contentType: "image/png",
    },
  ];
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const transporter = getTransporter();
  const attachments = input.attachments ?? defaultBrandAttachments();

  if (!transporter) {
    console.warn(
      "[email] SMTP_USER / SMTP_PASS not set — printing email instead of sending"
    );
    console.warn("[email] to:", input.to);
    console.warn("[email] subject:", input.subject);
    console.warn(
      "[email] attachments:",
      attachments.map((a) => `${a.filename}${a.cid ? ` (cid:${a.cid})` : ""}`)
    );
    console.warn("[email] html (first 800 chars):\n", input.html.slice(0, 800));
    return;
  }

  await transporter.sendMail({
    from: env.EMAIL_FROM,
    to: input.to,
    subject: input.subject,
    html: input.html,
    attachments: attachments.map((a) => ({
      filename: a.filename,
      path: a.path,
      content: a.content,
      cid: a.cid,
      contentType: a.contentType,
    })),
  });
}
