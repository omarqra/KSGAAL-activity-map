/**
 * One-shot, idempotent bootstrap for a fresh database.
 *
 * Run by the migration Job straight after `prisma migrate deploy`. Migrations
 * create the tables; without this the schema is correct and the product is
 * unusable, because there is no role to authorise anything and no account to
 * sign in with.
 *
 * It also loads the globe's reference data — activity types, countries,
 * organizations, activities — but only into an empty database. Without that
 * the deployment comes up correct and blank: no globe, no dashboard rows.
 *
 * Note what this is NOT: `npm run db:seed` wipes every activity, type,
 * organization and country before importing. That belongs to local
 * development and must never run against a deployed database. Here the import
 * is guarded by a count, so a second deploy cannot overwrite anything that was
 * edited through the dashboard. Set DATA_REIMPORT=true for one deploy to force
 * a clear-and-reimport, the same way ADMIN_PASSWORD_RESET works.
 *
 * Bundled to plain JavaScript at image build time (see the Dockerfile) because
 * the runtime image has no TypeScript loader — only Node and the generated
 * Prisma client.
 */
import { PrismaClient } from "@prisma/client";

import {
  clearGlobeData,
  importGlobeData,
  isGlobeDataEmpty,
} from "./import-data";
import { seedRoles } from "./seed-roles-fn";
import { seedAdminUser } from "./seed-user";

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    /* Admin first, then roles. seedRoles links any user that has no role yet,
       so doing it in this order attaches the new account in the same pass
       instead of leaving it role-less until the next deploy. */
    if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
      /* Opt-in per deploy. The account is created on the first run and left
         alone afterwards, so a forgotten password would otherwise be
         unrecoverable here: this deployment has no working mail, which rules
         out the reset-by-email path the app itself offers. */
      const resetPassword =
        (process.env.ADMIN_PASSWORD_RESET ?? "").toLowerCase() === "true";
      if (resetPassword) {
        console.log(
          "ADMIN_PASSWORD_RESET is on — the existing admin password will be " +
            "overwritten with the current value of ADMIN_PASSWORD."
        );
      }
      await seedAdminUser(prisma, { resetPassword });
    } else {
      console.log(
        "ADMIN_EMAIL / ADMIN_PASSWORD are not set — no admin account will be " +
          "created. The dashboard will have no way to sign in."
      );
    }
    await seedRoles(prisma);

    /* The globe's reference data. Guarded on emptiness so redeploys never
       discard dashboard edits; DATA_REIMPORT=true overrides for one run. */
    const reimport = (process.env.DATA_REIMPORT ?? "").toLowerCase() === "true";
    if (reimport) {
      console.log(
        "DATA_REIMPORT is on — clearing the globe data and importing it again " +
          "from the file shipped in this image. Anything edited through the " +
          "dashboard will be lost."
      );
      await clearGlobeData(prisma);
      const count = await importGlobeData(prisma);
      console.log(`→ reimported ${count} activities`);
    } else if (await isGlobeDataEmpty(prisma)) {
      console.log("→ database has no globe data yet — importing it");
      const count = await importGlobeData(prisma);
      console.log(`→ imported ${count} activities`);
    } else {
      console.log(
        "→ globe data is already present — leaving it untouched (set " +
          "DATA_REIMPORT=true to replace it)"
      );
    }

    console.log("✓ bootstrap complete");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err: unknown) => {
  console.error("bootstrap failed:", err);
  process.exit(1);
});
