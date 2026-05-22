import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadCount,
} from "../services/notification.service.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import type { ApiResponse } from "../types/index.js";

const router = new Hono();

router.use("*", authMiddleware);

const listQuerySchema = z.object({
  unreadOnly: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(30),
});

router.get("/", zValidator("query", listQuerySchema), async (c) => {
  const { userId } = c.get("user");
  const query = c.req.valid("query");
  const result = await getUserNotifications(userId, query);
  return c.json<ApiResponse>({ success: true, data: result });
});

router.get("/unread-count", async (c) => {
  const { userId } = c.get("user");
  const count = await getUnreadCount(userId);
  return c.json<ApiResponse>({ success: true, data: { count } });
});

router.post("/:notificationId/read", async (c) => {
  const { userId } = c.get("user");
  const { notificationId } = c.req.param();
  const notification = await markNotificationRead(notificationId, userId);
  return c.json<ApiResponse>({ success: true, data: notification });
});

router.post("/read-all", async (c) => {
  const { userId } = c.get("user");
  const result = await markAllNotificationsRead(userId);
  return c.json<ApiResponse>({ success: true, data: result });
});

export { router as notificationsRouter };
