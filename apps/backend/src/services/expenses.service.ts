import { prisma } from "../db/prisma.js";
import { HTTPException } from "hono/http-exception";
import type { ExpenseCategory, ExpenseStatus, SplitType } from "@prisma/client";
import { recalculateGroupSettlements } from "./settlement.service.js";
import { createNotification } from "./notification.service.js";

export interface CreateExpenseInput {
  groupId: string;
  paidByUserId: string;
  totalAmount: number;
  description: string;
  category?: ExpenseCategory;
  splitType?: SplitType;
  splits: Array<{ userId: string; amount?: number }>;
  notes?: string;
}

function buildEqualSplits(memberIds: string[], totalAmount: number): Array<{ userId: string; amount: number }> {
  const share = Math.floor((totalAmount / memberIds.length) * 100) / 100;
  const remainder = Math.round((totalAmount - share * memberIds.length) * 100) / 100;

  return memberIds.map((userId, idx) => ({
    userId,
    // The first member absorbs any rounding remainder.
    amount: idx === 0 ? share + remainder : share,
  }));
}

export async function createExpense(
  requestingUserId: string,
  input: CreateExpenseInput
) {
  // Authorization: requesting user must be a group member.
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: input.groupId, userId: requestingUserId } },
  });
  if (!membership) throw new HTTPException(403, { message: "You are not a member of this group" });

  const splitType: SplitType = input.splitType ?? "EQUAL";
  let finalSplits: Array<{ userId: string; amount: number }>;

  if (splitType === "EQUAL") {
    const memberIds = input.splits.length > 0
      ? input.splits.map((s) => s.userId)
      : (
          await prisma.groupMember.findMany({
            where: { groupId: input.groupId },
            select: { userId: true },
          })
        ).map((m) => m.userId);

    finalSplits = buildEqualSplits(memberIds, input.totalAmount);
  } else {
    // EXACT mode: every split amount must be provided and must sum to totalAmount.
    if (input.splits.some((s) => s.amount === undefined)) {
      throw new HTTPException(400, { message: "Exact split amounts required for EXACT split type" });
    }
    const sum = input.splits.reduce((acc, s) => acc + (s.amount ?? 0), 0);
    if (Math.abs(sum - input.totalAmount) > 0.01) {
      throw new HTTPException(400, {
        message: `Split amounts (${sum}) do not equal totalAmount (${input.totalAmount})`,
      });
    }
    finalSplits = input.splits.map((s) => ({ userId: s.userId, amount: s.amount! }));
  }

  // Payer's own split does not generate a debt — but we still record it for
  // accurate "who participated" bookkeeping and receipt breakdown.
  const expense = await prisma.$transaction(async (tx) => {
    const created = await tx.expense.create({
      data: {
        groupId: input.groupId,
        paidByUserId: input.paidByUserId,
        totalAmount: input.totalAmount,
        description: input.description,
        category: input.category ?? "OTHER",
        splitType,
        status: "PENDING",
        notes: input.notes,
        splits: {
          create: finalSplits.map((s) => ({
            oweUserId: s.userId,
            amount: s.amount,
            // Payer's own portion is auto-confirmed; no notification needed.
            isConfirmed: s.userId === input.paidByUserId,
            confirmedAt: s.userId === input.paidByUserId ? new Date() : null,
          })),
        },
      },
      include: {
        splits: true,
        paidBy: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Create in-app notifications for all non-payer participants.
    const notifiees = finalSplits
      .map((s) => s.userId)
      .filter((uid) => uid !== input.paidByUserId);

    await tx.notification.createMany({
      data: notifiees.map((uid) => ({
        userId: uid,
        type: "EXPENSE_ADDED" as const,
        title: "New expense to confirm",
        message: `${created.paidBy.name} added "${input.description}" — you owe ${
          finalSplits.find((s) => s.userId === uid)?.amount?.toFixed(2) ?? "0.00"
        }`,
        metaData: { expenseId: created.id, groupId: input.groupId },
      })),
    });

    return created;
  });

  return expense;
}

export async function getGroupExpenses(
  groupId: string,
  requestingUserId: string,
  filters: { status?: ExpenseStatus; category?: ExpenseCategory; page?: number; limit?: number }
) {
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: requestingUserId } },
  });
  if (!membership) throw new HTTPException(403, { message: "You are not a member of this group" });

  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const skip = (page - 1) * limit;

  const [expenses, total] = await prisma.$transaction([
    prisma.expense.findMany({
      where: {
        groupId,
        ...(filters.status && { status: filters.status }),
        ...(filters.category && { category: filters.category }),
      },
      include: {
        paidBy: { select: { id: true, name: true, avatar: true } },
        splits: {
          include: { ower: { select: { id: true, name: true, avatar: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.expense.count({
      where: {
        groupId,
        ...(filters.status && { status: filters.status }),
        ...(filters.category && { category: filters.category }),
      },
    }),
  ]);

  return {
    data: expenses,
    total,
    page,
    limit,
    hasMore: skip + expenses.length < total,
  };
}

export async function getExpenseById(expenseId: string, requestingUserId: string) {
  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: {
      paidBy: { select: { id: true, name: true, avatar: true } },
      splits: {
        include: { ower: { select: { id: true, name: true, avatar: true } } },
      },
      group: { select: { id: true, name: true } },
    },
  });

  if (!expense) throw new HTTPException(404, { message: "Expense not found" });

  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: expense.groupId, userId: requestingUserId } },
  });
  if (!membership) throw new HTTPException(403, { message: "Access denied" });

  return expense;
}

export async function confirmSplit(expenseId: string, splitId: string, requestingUserId: string) {
  const split = await prisma.expenseSplit.findUnique({
    where: { id: splitId },
    include: { expense: true },
  });

  if (!split) throw new HTTPException(404, { message: "Split not found" });
  if (split.expenseId !== expenseId) throw new HTTPException(400, { message: "Split does not belong to this expense" });
  if (split.oweUserId !== requestingUserId) {
    throw new HTTPException(403, { message: "You can only confirm your own split" });
  }
  if (split.isConfirmed) throw new HTTPException(409, { message: "Split already confirmed" });
  if (split.expense.status === "REJECTED") {
    throw new HTTPException(400, { message: "Expense has been rejected" });
  }

  await prisma.expenseSplit.update({
    where: { id: splitId },
    data: { isConfirmed: true, confirmedAt: new Date() },
  });

  // Check whether ALL splits are now confirmed.
  const allSplits = await prisma.expenseSplit.findMany({ where: { expenseId } });
  const allConfirmed = allSplits.every((s) => s.isConfirmed);

  if (allConfirmed) {
    await prisma.expense.update({
      where: { id: expenseId },
      data: { status: "ACTIVE" },
    });

    // Notify the payer that the expense is fully confirmed.
    await createNotification({
      userId: split.expense.paidByUserId,
      type: "EXPENSE_CONFIRMED",
      title: "Expense confirmed",
      message: `All members confirmed "${split.expense.description}"`,
      metaData: { expenseId, groupId: split.expense.groupId },
    });

    // Recalculate optimized settlements for the group.
    await recalculateGroupSettlements(split.expense.groupId);
  }

  return { confirmed: true, expenseActivated: allConfirmed };
}

export async function disputeExpense(expenseId: string, requestingUserId: string, reason?: string) {
  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: { splits: true },
  });

  if (!expense) throw new HTTPException(404, { message: "Expense not found" });
  if (expense.status !== "PENDING") {
    throw new HTTPException(400, { message: "Only PENDING expenses can be disputed" });
  }

  const isParticipant = expense.splits.some((s) => s.oweUserId === requestingUserId);
  if (!isParticipant && expense.paidByUserId !== requestingUserId) {
    throw new HTTPException(403, { message: "You are not a participant in this expense" });
  }

  await prisma.expense.update({ where: { id: expenseId }, data: { status: "REJECTED" } });

  await createNotification({
    userId: expense.paidByUserId,
    type: "EXPENSE_REJECTED",
    title: "Expense disputed",
    message: `A member disputed "${expense.description}"${reason ? `: ${reason}` : ""}`,
    metaData: { expenseId, groupId: expense.groupId, reason },
  });

  return { disputed: true };
}

export async function getGroupAnalytics(groupId: string, requestingUserId: string, period: "week" | "month" | "year") {
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: requestingUserId } },
  });
  if (!membership) throw new HTTPException(403, { message: "Access denied" });

  const now = new Date();
  const startDate = new Date(now);
  if (period === "week") startDate.setDate(now.getDate() - 7);
  else if (period === "month") startDate.setMonth(now.getMonth() - 1);
  else startDate.setFullYear(now.getFullYear() - 1);

  const expenses = await prisma.expense.findMany({
    where: { groupId, status: "ACTIVE", createdAt: { gte: startDate } },
    select: { totalAmount: true, category: true, createdAt: true, paidByUserId: true },
  });

  const byCategory = expenses.reduce<Record<string, number>>((acc, e) => {
    const key = e.category;
    acc[key] = (acc[key] ?? 0) + Number(e.totalAmount);
    return acc;
  }, {});

  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.totalAmount), 0);

  return { period, totalSpent, byCategory, expenseCount: expenses.length };
}
