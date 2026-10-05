/**
 * Local development seed: wipe and reimport everything, then make sure there is
 * an account to sign in with.
 *
 * This is the destructive path and belongs to a developer's own machine. A
 * deployed database is filled by `prisma/bootstrap.ts` instead, which imports
 * only when there is nothing to lose.
 */
import { PrismaClient } from "@prisma/client";

import { clearGlobeData, importGlobeData } from "./import-data";
import { seedRoles } from "./seed-roles-fn";
import { seedAdminUser } from "./seed-user";

const prisma = new PrismaClient();

async function main() {
  await clearGlobeData(prisma);
  await importGlobeData(prisma);

  console.log("→ seeding admin user");
  await seedAdminUser(prisma);

  console.log("→ seeding roles & linking users");
  await seedRoles(prisma);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
