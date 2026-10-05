/**
 * Standalone entrypoint for `npm run db:seed:user`.
 *
 * Deliberately a separate file. When this lived at the bottom of
 * `seed-user.ts` behind `require.main === module`, it was dormant locally but
 * fired inside the deployed image: esbuild bundles `bootstrap.ts` and its
 * imports into one CommonJS file, so that file *is* the main module and the
 * guard reads as true. The admin upsert then ran a second time, concurrently
 * with the bootstrap's own call, on its own Prisma connection.
 */
import { PrismaClient } from "@prisma/client";

import { seedAdminUser } from "./seed-user";

const prisma = new PrismaClient();

seedAdminUser(prisma)
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
