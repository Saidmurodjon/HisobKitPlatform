import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";
import { authRouter } from "./routes/auth.routes.js";
import { groupsRouter } from "./routes/groups.routes.js";
import { expensesRouter } from "./routes/expenses.routes.js";
import { settlementsRouter } from "./routes/settlements.routes.js";
import { notificationsRouter } from "./routes/notifications.routes.js";

const app = new Hono();

// ─── Global Middleware ────────────────────────────────────────────────────────

app.use("*", logger());
app.use("*", secureHeaders());
app.use(
  "*",
  cors({
    // Accept requests from the Pages domain and the local dev server.
    origin: (origin) => {
      const allowed = [
        env.FRONTEND_URL,
        "http://localhost:5173",
        "http://localhost:4173",
      ];
      return allowed.includes(origin) ? origin : allowed[0]!;
    },
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  })
);

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get("/health", (c) =>
  c.json({ status: "ok", timestamp: new Date().toISOString(), version: "1.0.0" })
);

// ─── API Routes ───────────────────────────────────────────────────────────────

app.route("/api/auth", authRouter);
app.route("/api/groups", groupsRouter);
app.route("/api/expenses", expensesRouter);
app.route("/api/settlements", settlementsRouter);
app.route("/api/notifications", notificationsRouter);

// ─── Error & 404 Handlers ─────────────────────────────────────────────────────

app.onError(errorHandler);
app.notFound(notFoundHandler);

// ─── Runtime Bootstrap ────────────────────────────────────────────────────────
// `export default app` is the Cloudflare Workers fetch handler.
// When running under Bun (local dev) we also start the HTTP server.

export default app;

if (typeof Bun !== "undefined") {
  const server = Bun.serve({ fetch: app.fetch, port: env.PORT });
  console.log(`🚀 HisobKit API  →  http://localhost:${server.port}`);
  console.log(`📦 Environment   →  ${env.NODE_ENV}`);
}
