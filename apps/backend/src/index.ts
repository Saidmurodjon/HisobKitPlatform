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
    origin: [env.FRONTEND_URL],
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

// ─── Server Bootstrap ─────────────────────────────────────────────────────────

const server = Bun.serve({
  fetch: app.fetch,
  port: env.PORT,
});

console.log(`🚀 HisobKit API running on http://localhost:${server.port}`);
console.log(`📦 Environment: ${env.NODE_ENV}`);

export default app;
