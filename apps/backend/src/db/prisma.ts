import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { env } from "../config/env.js";

// Force HTTP mode: queries go over HTTPS (port 443) via fetch().
// Works in Cloudflare Workers, Bun, Node — no TCP port 5432 ever needed.
neonConfig.poolQueryViaFetch = true;

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function makePrismaClient(): PrismaClient {
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  const adapter = new PrismaNeon(pool);
  return new PrismaClient({
    adapter,
    log: env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? makePrismaClient();

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
