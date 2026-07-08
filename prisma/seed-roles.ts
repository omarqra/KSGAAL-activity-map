import { PrismaClient } from "@prisma/client";

import { seedRoles } from "./seed-roles-fn";

const prisma = new PrismaClient();

seedRoles(prisma)
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
