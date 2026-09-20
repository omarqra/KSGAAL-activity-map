import { PrismaClient } from "@prisma/client";

declare global {
  var __prisma: PrismaClient | undefined;
}

/**
 * Whether a database is configured at all.
 *
 * Distinct from "the database is reachable": callers use this to tell a
 * deployment that was never given a DATABASE_URL (degraded on purpose) from
 * one whose database is down (a real fault). Read from `process.env` rather
 * than the parsed env so this module stays usable from scripts.
 */
export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

/**
 * Built lazily. Constructing a PrismaClient without a datasource URL throws,
 * and this module is imported by routes that must still respond when no
 * database is configured — the health probe above all.
 */
function createClient(): PrismaClient {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

let client: PrismaClient | undefined;

function getClient(): PrismaClient {
  if (!isDatabaseConfigured()) {
    throw new Error(
      "DATABASE_URL is not set. This deployment is running without a " +
        "database; guard database access with isDatabaseConfigured()."
    );
  }
  if (!client) {
    client = global.__prisma ?? createClient();
    if (process.env.NODE_ENV !== "production") global.__prisma = client;
  }
  return client;
}

/**
 * Same shape as before — `prisma.user.findMany()` still works — but nothing
 * is constructed until the first property access, so merely importing this
 * module is safe with no database.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const c = getClient();
    const value = Reflect.get(c, prop) as unknown;
    // Bind to the real client, not the Proxy: Prisma's methods rely on
    // `this`, and handing them the Proxy would recurse through this trap.
    return typeof value === "function" ? value.bind(c) : value;
  },
});
