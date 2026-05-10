import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { sanitizeError } from "@/lib/log/sanitize";

export type ApiSuccess<T> = { data: T; error: null };
export type ApiError = {
  data: null;
  error: { message: string; code?: string; details?: unknown };
};

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiSuccess<T>>({ data, error: null }, init);
}

export function created<T>(data: T) {
  return ok(data, { status: 201 });
}

export function fail(
  message: string,
  status = 400,
  code?: string,
  details?: unknown
) {
  return NextResponse.json<ApiError>(
    { data: null, error: { message, code, details } },
    { status }
  );
}

export function notFound(resource: string) {
  return fail(`${resource} not found`, 404, "NOT_FOUND");
}

export function handleError(err: unknown) {
  if (err instanceof ZodError) {
    const issues = err.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
    }));
    // Surface the first issue's translation key so simple clients can show
    // a meaningful message even without parsing `details`.
    const firstMessage = issues[0]?.message ?? "VALIDATION_ERROR";
    return fail(firstMessage, 422, "VALIDATION_ERROR", issues);
  }
  if (
    err &&
    typeof err === "object" &&
    "code" in err &&
    typeof (err as { code: unknown }).code === "string"
  ) {
    const code = (err as { code: string }).code;
    if (code === "P2002") {
      return fail("Unique constraint violation", 409, "CONFLICT");
    }
    if (code === "P2025") {
      return fail("Record not found", 404, "NOT_FOUND");
    }
    if (code === "P2003") {
      return fail("Foreign key constraint failed", 409, "FK_CONSTRAINT");
    }
  }
  console.error("[api]", sanitizeError(err));
  return fail("Internal server error", 500, "INTERNAL");
}

export function parseId(raw: string): number | null {
  const id = Number(raw);
  if (!Number.isFinite(id) || !Number.isInteger(id) || id <= 0) return null;
  return id;
}

export function parsePagination(searchParams: URLSearchParams) {
  const pageRaw = Number(searchParams.get("page") ?? "1");
  const sizeRaw = Number(searchParams.get("pageSize") ?? "20");
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
  const pageSize =
    Number.isFinite(sizeRaw) && sizeRaw > 0 && sizeRaw <= 100
      ? Math.floor(sizeRaw)
      : 20;
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}
