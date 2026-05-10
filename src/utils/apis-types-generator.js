/* eslint-disable n/no-process-env */
import { execSync } from "child_process";
import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  NEXT_PUBLIC_BACKEND_URL: z.string().url(),
});

const env = envSchema.parse(process.env);

const apiUrl = `${env.NEXT_PUBLIC_BACKEND_URL}/documentation/json`;

console.log("Generating API types from:", apiUrl);

try {
  execSync(
    `npx swagger-typescript-api generate --path=${apiUrl} --extract-request-body --extract-response-body --extract-request-params --output ./src/types --axios --api-class-name=Apis --name=apis-types.ts --module-name-index=0`,
    {
      stdio: "inherit",
    }
  );
  console.log("✓ API types generated successfully");
} catch (error) {
  console.error("Error generating API types:", error.message);
  process.exit(1);
}
