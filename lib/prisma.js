// Single shared Prisma client. In dev, Next.js hot-reload re-runs modules on
// every change; without this guard we'd open a new pool of DB connections each
// time and eventually exhaust Postgres. Caching the client on globalThis keeps
// exactly one instance across reloads. In production a fresh module is fine.
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
