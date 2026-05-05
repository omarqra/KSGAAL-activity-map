import { PrismaClient } from '../generated/prisma/client'

type PrismaGlobal = { prisma?: InstanceType<typeof PrismaClient> }
const globalForPrisma = globalThis as unknown as PrismaGlobal

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const prisma: InstanceType<typeof PrismaClient> = globalForPrisma.prisma ?? new (PrismaClient as any)()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
