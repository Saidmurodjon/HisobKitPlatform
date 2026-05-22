import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  createExpense,
  getGroupExpenses,
  getExpenseById,
  confirmSplit,
  disputeExpense,
  getGroupAnalytics,
} from "../services/expenses.service.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import type { ApiResponse } from "../types/index.js";

const router = new Hono();

router.use("*", authMiddleware);

const createExpenseSchema = z.object({
  groupId: z.string().min(1),
  paidByUserId: z.string().optional(),
  totalAmount: z.number().positive(),
  description: z.string().min(1).max(255),
  category: z
    .enum(["FOOD", "RENT", "UTILITIES", "ENTERTAINMENT", "TRANSPORT", "HEALTHCARE", "SHOPPING", "TRAVEL", "OTHER"])
    .optional(),
  splitType: z.enum(["EQUAL", "EXACT"]).optional(),
  splits: z
    .array(
      z.object({
        userId: z.string().min(1),
        amount: z.number().positive().optional(),
      })
    )
    .default([]),
  notes: z.string().max(1000).optional(),
});

const expenseQuerySchema = z.object({
  status: z.enum(["PENDING", "ACTIVE", "REJECTED"]).optional(),
  category: z
    .enum(["FOOD", "RENT", "UTILITIES", "ENTERTAINMENT", "TRANSPORT", "HEALTHCARE", "SHOPPING", "TRAVEL", "OTHER"])
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

router.get("/group/:groupId", zValidator("query", expenseQuerySchema), async (c) => {
  const { userId } = c.get("user");
  const { groupId } = c.req.param();
  const query = c.req.valid("query");
  const result = await getGroupExpenses(groupId, userId, query);
  return c.json<ApiResponse>({ success: true, data: result });
});

router.get("/group/:groupId/analytics", async (c) => {
  const { userId } = c.get("user");
  const { groupId } = c.req.param();
  const period = (c.req.query("period") as "week" | "month" | "year") ?? "month";
  const data = await getGroupAnalytics(groupId, userId, period);
  return c.json<ApiResponse>({ success: true, data });
});

router.get("/:expenseId", async (c) => {
  const { userId } = c.get("user");
  const { expenseId } = c.req.param();
  const expense = await getExpenseById(expenseId, userId);
  return c.json<ApiResponse>({ success: true, data: expense });
});

router.post("/", zValidator("json", createExpenseSchema), async (c) => {
  const { userId } = c.get("user");
  const body = c.req.valid("json");
  const expense = await createExpense(userId, {
    ...body,
    paidByUserId: body.paidByUserId ?? userId,
  });
  return c.json<ApiResponse>({ success: true, data: expense }, 201);
});

router.post("/:expenseId/splits/:splitId/confirm", async (c) => {
  const { userId } = c.get("user");
  const { expenseId, splitId } = c.req.param();
  const result = await confirmSplit(expenseId, splitId, userId);
  return c.json<ApiResponse>({ success: true, data: result });
});

router.post("/:expenseId/dispute", async (c) => {
  const { userId } = c.get("user");
  const { expenseId } = c.req.param();
  const body = await c.req.json().catch(() => ({})) as { reason?: string };
  const result = await disputeExpense(expenseId, userId, body.reason);
  return c.json<ApiResponse>({ success: true, data: result });
});

export { router as expensesRouter };
