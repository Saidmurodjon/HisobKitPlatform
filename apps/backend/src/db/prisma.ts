import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { env } from "../config/env.js";

// Use the native Bun WebSocket so Prisma + Neon work entirely over WSS (port 443).
// This eliminates any dependency on TCP port 5432 in the runtime.
neonConfig.webSocketConstructor = WebSocket;

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
