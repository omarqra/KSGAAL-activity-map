import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

export interface SeedAdminOptions {
  /**
   * Overwrite the password of an account that already exists.
   *
   * Off by default, and deliberately so: the bootstrap runs on every deploy,
   * and resetting the password each time would silently undo any change the
   * admin made from inside the app. Turned on only for a deploy that is
   * explicitly asked to recover a forgotten password.
   */
  resetPassword?: boolean;
}

export async function seedAdminUser(
  prisma: PrismaClient,
  options: SeedAdminOptions = {}
) {
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
    update: {
      name,
      isActive: true,
      ...(options.resetPassword ? { passwordHash } : {}),
    },
    create: {
      email,
      name,
      passwordHash,
      role: "admin",
      isActive: true,
    },
  });

  console.log(
    `✓ admin user ready: ${user.email} (id=${user.id})` +
      (options.resetPassword ? " — password reset to ADMIN_PASSWORD" : "")
  );
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
