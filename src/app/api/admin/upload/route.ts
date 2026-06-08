import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { NextRequest } from "next/server";

import { requireApiUser } from "@/lib/auth/require-api-user";

import { fail, handleError, ok } from "../../_lib/http";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;
const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Local image upload. Stores the file under `public/uploads/` and returns its
 * public path (e.g. `/uploads/<uuid>.jpg`). Replaces the previous dependency on
 * an external upload backend that returned 404 in this deployment.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return fail("NO_FILE", 400, "NO_FILE");
    }

    const ext = EXT_BY_TYPE[file.type];
    if (!ext) return fail("UNSUPPORTED_TYPE", 415, "UNSUPPORTED_TYPE");
    if (file.size > MAX_BYTES) return fail("FILE_TOO_LARGE", 413, "FILE_TOO_LARGE");

    const buffer = Buffer.from(await file.arrayBuffer());
    const dir = join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    const filename = `${randomUUID()}.${ext}`;
    await writeFile(join(dir, filename), buffer);

    return ok({ path: `/uploads/${filename}` });
  } catch (err) {
    return handleError(err);
  }
}
