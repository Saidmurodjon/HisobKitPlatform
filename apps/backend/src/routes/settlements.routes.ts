import { Hono } from "hono";
import {
  getGroupSettlements,
  markSettlementPaid,
  getGroupBalanceSummary,
  recalculateGroupSettlements,
} from "../services/settlement.service.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import type { ApiResponse } from "../types/index.js";

const router = new Hono();

router.use("*", authMiddleware);

router.get("/group/:groupId", async (c) => {
  const { userId } = c.get("user");
  const { groupId } = c.req.param();
  const settlements = await getGroupSettlements(groupId, userId);
  return c.json<ApiResponse>({ success: true, data: settlements });
});

router.get("/group/:groupId/balance", async (c) => {
  const { userId } = c.get("user");
  const { groupId } = c.req.param();
  const summary = await getGroupBalanceSummary(groupId, userId);
  return c.json<ApiResponse>({ success: true, data: summary });
});

router.post("/group/:groupId/recalculate", async (c) => {
  const { userId } = c.get("user");
  const { groupId } = c.req.param();
  // Authorization check is handled inside the service.
  await getGroupBalanceSummary(groupId, userId); // membership gate
  await recalculateGroupSettlements(groupId);
  return c.json<ApiResponse>({ success: true, message: "Settlements recalculated" });
});

router.post("/:settlementId/pay", async (c) => {
  const { userId } = c.get("user");
  const { settlementId } = c.req.param();
  const updated = await markSettlementPaid(settlementId, userId);
  return c.json<ApiResponse>({ success: true, data: updated });
});

export { router as settlementsRouter };
