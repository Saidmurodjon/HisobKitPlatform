/**
 * Applies the Prisma-generated schema SQL to Neon DB via the serverless
 * HTTP driver (HTTPS port 443 only — no TCP 5432 or WebSocket needed).
 *
 * Usage:
 *   bun run scripts/apply-schema.ts path/to/schema.sql
 */

import { readFileSync } from "fs";
import { resolve } from "path";

const DATABASE_URL = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌  DATABASE_URL or DIRECT_URL must be set in environment");
  process.exit(1);
}

const sqlPath = process.argv[2];
if (!sqlPath) {
  console.error("❌  Usage: bun run scripts/apply-schema.ts <path-to-sql>");
  process.exit(1);
}

// Parse connection string for host, user, password, dbname.
const url = new URL(DATABASE_URL);
const host = url.hostname;
const password = decodeURIComponent(url.password);
const user = url.username;
const database = url.pathname.slice(1);

// Neon HTTP SQL endpoint — works over HTTPS (443) in all environments.
const NEON_API_URL = `https://${host}/sql`;

async function runQuery(query: string): Promise<unknown> {
  const response = await fetch(NEON_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Neon-Connection-String": `postgresql://${user}:${password}@${host}/${database}?sslmode=require`,
    },
    body: JSON.stringify({ query, params: [] }),
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  return JSON.parse(text);
}

const rawSQL = readFileSync(resolve(sqlPath), "utf-8");

// Split on semicolons, strip comment-only lines, keep non-empty statements.
const statements = rawSQL
  .split(";")
  .map((s) =>
    s
      .split("\n")
      .filter((line) => !line.trim().startsWith("--"))
      .join("\n")
      .trim()
  )
  .filter((s) => s.length > 0);

console.log(`\n🔌  Targeting Neon HTTP endpoint: ${NEON_API_URL}`);
console.log(`📋  Executing ${statements.length} SQL statements\n`);

let executed = 0;
let failed = 0;

for (const stmt of statements) {
  const preview = stmt.replace(/\s+/g, " ").slice(0, 90);
  try {
    await runQuery(stmt);
    console.log(`  ✅  ${preview}`);
    executed++;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (
      msg.includes("already exists") ||
      msg.includes("duplicate") ||
      (msg.toLowerCase().includes("does not exist") && stmt.toLowerCase().startsWith("drop"))
    ) {
      console.log(`  ⏭️   Skipped (already exists): ${preview}`);
      executed++;
    } else {
      console.error(`  ❌  FAILED: ${preview}\n     → ${msg}`);
      failed++;
    }
  }
}

console.log(`\n${"─".repeat(60)}`);
if (failed === 0) {
  console.log(`✅  Schema applied successfully! (${executed} statements executed)`);
} else {
  console.log(`⚠️   Done with ${failed} failure(s). (${executed} succeeded)`);
  process.exit(1);
}
