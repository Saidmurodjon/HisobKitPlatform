import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  createGroup,
  getUserGroups,
  getGroupById,
  joinGroupByInviteCode,
  removeMember,
  updateGroup,
} from "../services/groups.service.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import type { ApiResponse } from "../types/index.js";

const router = new Hono();

router.use("*", authMiddleware);

const createGroupSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(["FLATMATES", "COWORKERS", "FRIENDS", "TRIP", "FAMILY", "OTHER"]).optional(),
});

const updateGroupSchema = createGroupSchema.partial();

router.get("/", async (c) => {
  const { userId } = c.get("user");
  const groups = await getUserGroups(userId);
  return c.json<ApiResponse>({ success: true, data: groups });
});

router.post("/", zValidator("json", createGroupSchema), async (c) => {
  const { userId } = c.get("user");
  const body = c.req.valid("json");
  const group = await createGroup(userId, body);
  return c.json<ApiResponse>({ success: true, data: group }, 201);
});

router.get("/:groupId", async (c) => {
  const { userId } = c.get("user");
  const { groupId } = c.req.param();
  const group = await getGroupById(groupId, userId);
  return c.json<ApiResponse>({ success: true, data: group });
});

router.put("/:groupId", zValidator("json", updateGroupSchema), async (c) => {
  const { userId } = c.get("user");
  const { groupId } = c.req.param();
  const body = c.req.valid("json");
  const group = await updateGroup(groupId, userId, body);
  return c.json<ApiResponse>({ success: true, data: group });
});

router.post("/join/:inviteCode", async (c) => {
  const { userId } = c.get("user");
  const { inviteCode } = c.req.param();
  const group = await joinGroupByInviteCode(inviteCode, userId);
  return c.json<ApiResponse>({ success: true, data: group });
});

router.delete("/:groupId/members/:memberId", async (c) => {
  const { userId } = c.get("user");
  const { groupId, memberId } = c.req.param();
  await removeMember(groupId, memberId, userId);
  return c.json<ApiResponse>({ success: true, message: "Member removed" });
});

export { router as groupsRouter };
