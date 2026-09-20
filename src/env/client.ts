import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  client: {
    // Empty means "same origin". The browser talks to whatever host it
    // loaded the page from, so the image no longer has a hostname baked in
    // and works behind a node port, an ingress, or localhost unchanged.
    NEXT_PUBLIC_BACKEND_URL: z.string().default(""),
    // Only used for SEO canonical/alternate links. Optional so a deployment
    // without a public hostname still builds and runs; the tags are simply
    // omitted.
    NEXT_PUBLIC_FRONTEND_URL: z.preprocess(
      (v) => (v === "" ? undefined : v),
      z.url().optional()
    ),
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().optional(),
  },
  runtimeEnv: {
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
    NEXT_PUBLIC_FRONTEND_URL: process.env.NEXT_PUBLIC_FRONTEND_URL,
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY:
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  },
  onValidationError: (issues) => {
    console.error("❌ Invalid environment variables:", issues);
    throw new Error(
      "Invalid environment variables. Check the console for more details."
    );
  },
});
