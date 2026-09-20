import { createEnv } from "@t3-oss/env-nextjs";
import { config } from "dotenv";
import { expand } from "dotenv-expand";
import { z } from "zod";

expand(config());

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "production"]),
    APP_ENV: z.enum(["dev", "uat", "staging", "prod"]).default("dev"),
    /* Optional on purpose. The academy has not provisioned a database for
       the development environment yet, and an app that refuses to boot
       without one cannot be shown to them at all. When it is absent the
       app runs in a degraded mode: the public globe serves empty, the
       readiness probe reports "not-configured" and still passes, and the
       admin screens surface the gap instead of the process exiting. */
    DATABASE_URL: z.string().url().optional(),
    SMTP_HOST: z.string().default("smtp.gmail.com"),
    SMTP_PORT: z.coerce.number().int().positive().default(465),
    SMTP_SECURE: z
      .enum(["true", "false"])
      .default("true")
      .transform((v) => v === "true"),
    SMTP_USER: z.string().min(1).optional(),
    SMTP_PASS: z.string().min(1).optional(),
    EMAIL_FROM: z
      .string()
      .default("مجمع الملك سلمان العالمي للغة العربية <no-reply@console.local>"),
    APP_URL: z.string().url().default("http://localhost:3000"),
  },
  onValidationError: (issues) => {
    console.error("❌ Invalid environment variables:", issues);
    process.exit(1);
  },
  emptyStringAsUndefined: true,
  experimental__runtimeEnv: process.env,
});
