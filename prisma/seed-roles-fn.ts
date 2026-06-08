import type { PrismaClient } from "@prisma/client";

import { ROLE_PRESETS } from "../src/lib/permissions";

/**
 * Seed the built-in roles and ensure every user is linked to one. Idempotent:
 * safe to run on every `db:seed`. Custom edits to editor/viewer permissions are
 * preserved; only the system admin role's permissions are refreshed.
 */
export async function seedRoles(prisma: PrismaClient): Promise<void> {
  const roleByKey: Record<string, number> = {};
  for (const [key, preset] of Object.entries(ROLE_PRESETS)) {
    const role = await prisma.role.upsert({
      where: { key },
      update: {
        nameAr: preset.nameAr,
        nameEn: preset.nameEn,
        isSystem: preset.isSystem,
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
  }

  // Every user must have a role — link any without one by their legacy `role`
  // string, defaulting to admin.
  const users = await prisma.user.findMany({
    where: { roleId: null },
    select: { id: true, role: true },
  });
  for (const u of users) {
    const targetId = roleByKey[u.role] ?? roleByKey.admin;
    await prisma.user.update({ where: { id: u.id }, data: { roleId: targetId } });
  }
  console.log(`✓ roles seeded; linked ${users.length} user(s) without a role`);
}
