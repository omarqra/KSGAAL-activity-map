import { PrismaClient } from "@prisma/client";

import { ROLE_PRESETS } from "../src/lib/permissions";

const prisma = new PrismaClient();

async function main() {
  // Upsert the three built-in roles from the shared presets.
  const roleByKey: Record<string, number> = {};
  for (const [key, preset] of Object.entries(ROLE_PRESETS)) {
    const role = await prisma.role.upsert({
      where: { key },
      update: {
        nameAr: preset.nameAr,
        nameEn: preset.nameEn,
        isSystem: preset.isSystem,
        // Only refresh permissions for the system admin role; custom edits to
        // editor/viewer made via the UI should not be overwritten on re-seed.
        ...(preset.isSystem ? { permissions: preset.permissions } : {}),
      },
      create: {
        key,
        nameAr: preset.nameAr,
        nameEn: preset.nameEn,
        isSystem: preset.isSystem,
        permissions: preset.permissions,
      },
    });
    roleByKey[key] = role.id;
    console.log(`role ${key} → id ${role.id}`);
  }

  // Link existing users to a role by their legacy `role` string (default admin).
  const users = await prisma.user.findMany({
    select: { id: true, role: true, roleId: true },
  });
  let linked = 0;
  for (const u of users) {
    if (u.roleId) continue;
    const targetId = roleByKey[u.role] ?? roleByKey.admin;
    await prisma.user.update({ where: { id: u.id }, data: { roleId: targetId } });
    linked++;
  }
  console.log(`linked ${linked} user(s) to roles.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
