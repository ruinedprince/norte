import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { PrismaClient } from "@/generated/prisma/client";

// One PrismaClient per process. Next's dev hot-reload re-imports modules, so we
// cache the instance on globalThis to avoid opening a new SQLite handle on every
// reload. Prisma 7 requires an explicit driver adapter — bare `new PrismaClient()`
// no longer works (see docs/escopo.md §1 + the Prisma 7 upgrade notes).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
