import { NextRequest } from "next/server";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { sanitizeForLog } from "@/lib/log/sanitize";

export type AuditAction =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "LOGIN_RATE_LIMITED"
  | "OTP_VERIFIED"
  | "OTP_FAILED"
  | "OTP_RESENT"
  | "PASSWORD_RESET_REQUESTED"
  | "PASSWORD_RESET_COMPLETED"
  | "USER_CREATED"
  | "USER_UPDATED"
  | "USER_DELETED"
  | "USER_PASSWORD_CHANGED"
  | "RESOURCE_CREATED"
  | "RESOURCE_UPDATED"
  | "RESOURCE_DELETED"
  | "UNAUTHORIZED_ACCESS"
  | "FORBIDDEN_ACCESS";

export type AuditInput = {
  action: AuditAction;
  userId?: number | null;
  resource?: string;
  resourceId?: string | number | null;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
};

export function getAuditClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export function getAuditUserAgent(req: NextRequest): string | null {
  return req.headers.get("user-agent");
}

export async function audit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: input.action,
        userId: input.userId ?? null,
        resource: input.resource ?? null,
        resourceId:
          input.resourceId === undefined || input.resourceId === null
            ? null
            : String(input.resourceId),
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
        metadata: input.metadata
          ? (sanitizeForLog(input.metadata) as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      },
    });
  } catch (err) {
    console.error("[audit] failed to write log", err);
  }
}

export async function auditFromRequest(
  req: NextRequest,
  input: Omit<AuditInput, "ip" | "userAgent">
): Promise<void> {
  await audit({
    ...input,
    ip: getAuditClientIp(req),
    userAgent: getAuditUserAgent(req),
  });
}
