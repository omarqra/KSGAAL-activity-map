#!/usr/bin/env node
/**
 * Daily database backup (BRD feedback #6).
 *
 * Dumps the PostgreSQL database referenced by DATABASE_URL into a timestamped
 * compressed file under ./backups, then prunes to the most recent
 * BACKUP_RETENTION (default 30) files.
 *
 * Usage:   node scripts/backup-db.mjs
 * Requires: `pg_dump` on PATH (PostgreSQL client tools).
 *
 * Schedule it daily:
 *   - Linux/cron:        0 2 * * *  cd /app && node scripts/backup-db.mjs
 *   - Windows Scheduler: a daily task running the same command
 * Store ./backups on a volume separate from the database (BRD: off-host).
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, readdirSync, statSync, unlinkSync } from "node:fs";
import { join, resolve } from "node:path";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const RETENTION = Number(process.env.BACKUP_RETENTION ?? "30");
const outDir = resolve(process.env.BACKUP_DIR ?? "backups");
mkdirSync(outDir, { recursive: true });

// Build a filesystem-safe UTC timestamp: YYYYMMDD-HHmmss
const now = new Date();
const pad = (n) => String(n).padStart(2, "0");
const stamp =
  `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}` +
  `-${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`;
const outFile = join(outDir, `backup-${stamp}.dump`);

// Custom format (-Fc) is compressed and restorable with pg_restore.
const res = spawnSync(
  "pg_dump",
  ["--format=custom", "--no-owner", "--no-privileges", "--file", outFile, url],
  { stdio: "inherit" },
);

if (res.error) {
  console.error("Failed to run pg_dump:", res.error.message);
  process.exit(1);
}
if (res.status !== 0) {
  console.error(`pg_dump exited with code ${res.status}`);
  process.exit(res.status ?? 1);
}

console.log(`Backup written: ${outFile}`);

// Prune old backups beyond the retention count.
const backups = readdirSync(outDir)
  .filter((f) => /^backup-\d{8}-\d{6}\.dump$/.test(f))
  .map((f) => ({ f, t: statSync(join(outDir, f)).mtimeMs }))
  .sort((a, b) => b.t - a.t);

for (const { f } of backups.slice(RETENTION)) {
  unlinkSync(join(outDir, f));
  console.log(`Pruned old backup: ${f}`);
}

console.log(`Retained ${Math.min(backups.length, RETENTION)} backup(s).`);
