import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

export async function seedAdminUser(prisma: PrismaClient) {
  const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME ?? "Admin";

  if (!email || !password) {
    throw new Error(
      "ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env to seed the admin user."
    );
  }
  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD must be at least 8 characters long.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: { name, isActive: true },
    create: {
      email,
      name,
      passwordHash,
      role: "admin",
      isActive: true,
    },
  });

  console.log(`✓ admin user ready: ${user.email} (id=${user.id})`);
  return user;
}

// Standalone entrypoint (npm run db:seed:user)
if (require.main === module) {
  const prisma = new PrismaClient();
  seedAdminUser(prisma)
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
