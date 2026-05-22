import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { loginWithGoogle, loginWithTelegram, getMe } from "../services/auth.service.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import type { ApiResponse } from "../types/index.js";

const router = new Hono();

const googleAuthSchema = z.object({
  idToken: z.string().min(1),
});

const telegramAuthSchema = z.object({
  initData: z.string().min(1),
});

router.post("/google", zValidator("json", googleAuthSchema), async (c) => {
  const { idToken } = c.req.valid("json");
  const result = await loginWithGoogle(idToken);
  return c.json<ApiResponse>({ success: true, data: result }, 200);
});

router.post("/telegram", zValidator("json", telegramAuthSchema), async (c) => {
  const { initData } = c.req.valid("json");
  const result = await loginWithTelegram(initData);
  return c.json<ApiResponse>({ success: true, data: result }, 200);
});

router.get("/me", authMiddleware, async (c) => {
  const { userId } = c.get("user");
  const user = await getMe(userId);
  return c.json<ApiResponse>({ success: true, data: user });
});

export { router as authRouter };
