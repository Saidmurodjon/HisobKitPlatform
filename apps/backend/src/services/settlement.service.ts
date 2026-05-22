import { prisma } from "../db/prisma.js";
import { HTTPException } from "hono/http-exception";
import { computeGroupNetBalances, optimizeDebts } from "../algorithms/debt-optimizer.js";
import { createNotification } from "./notification.service.js";

/**
 * Core settlement engine. Recomputes the minimal set of transactions required
 * to settle all active debts in a group, atomically replacing any existing
 * PENDING settlements.
 */
export async function recalculateGroupSettlements(groupId: string): Promise<void> {
  const expenses = await prisma.expense.findMany({
    where: { groupId, status: "ACTIVE" },
    select: {
      paidByUserId: true,
      splits: {
        where: { isConfirmed: true },
        select: { oweUserId: true, amount: true },
      },
    },
  });

  const netBalances = computeGroupNetBalances(
    expenses.map((e) => ({
      paidByUserId: e.paidByUserId,
      splits: e.splits.map((s) => ({
        oweUserId: s.oweUserId,
        amount: typeof s.amount === "object" ? Number(s.amount) : s.amount,
      })),
    }))
  );

  const optimizedTransactions = optimizeDebts(netBalances);

  await prisma.$transaction([
    prisma.settlement.deleteMany({ where: { groupId, status: "PENDING" } }),
    ...optimizedTransactions.map((t) =>
      prisma.settlement.create({
        data: {
          groupId,
          fromUserId: t.fromUserId,
          toUserId: t.toUserId,
          amount: t.amount,
          isPaid: false,
          status: "PENDING",
        },
      })
    ),
  ]);
}

export async function getGroupSettlements(groupId: string, requestingUserId: string) {
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: requestingUserId } },
  });
  if (!membership) throw new HTTPException(403, { message: "Access denied" });

  return prisma.settlement.findMany({
    where: { groupId },
    include: {
      fromUser: { select: { id: true, name: true, avatar: true } },
      toUser: { select: { id: true, name: true, avatar: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function markSettlementPaid(
  settlementId: string,
  requestingUserId: string
): Promise<object> {
  const settlement = await prisma.settlement.findUnique({ where: { id: settlementId } });
  if (!settlement) throw new HTTPException(404, { message: "Settlement not found" });
  if (settlement.fromUserId !== requestingUserId) {
    throw new HTTPException(403, { message: "Only the payer can mark a settlement as paid" });
  }
  if (settlement.status === "COMPLETED") {
    throw new HTTPException(409, { message: "Settlement already completed" });
  }

  const updated = await prisma.settlement.update({
    where: { id: settlementId },
    data: { isPaid: true, status: "COMPLETED", paidAt: new Date() },
  });

  await createNotification({
    userId: settlement.toUserId,
    type: "SETTLEMENT_COMPLETED",
    title: "Payment received",
    message: `You received ${Number(settlement.amount).toFixed(2)} from a group member`,
    metaData: { settlementId, groupId: settlement.groupId },
  });

  return updated;
}

export async function getGroupBalanceSummary(groupId: string, requestingUserId: string) {
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: requestingUserId } },
  });
  if (!membership) throw new HTTPException(403, { message: "Access denied" });

  const settlements = await prisma.settlement.findMany({
    where: { groupId, status: "PENDING" },
    include: {
      fromUser: { select: { id: true, name: true, avatar: true } },
      toUser: { select: { id: true, name: true, avatar: true } },
    },
  });

  const youOwe = settlements
    .filter((s) => s.fromUserId === requestingUserId)
    .map((s) => ({ user: s.toUser, amount: Number(s.amount), settlementId: s.id }));

  const youAreOwed = settlements
    .filter((s) => s.toUserId === requestingUserId)
    .map((s) => ({ user: s.fromUser, amount: Number(s.amount), settlementId: s.id }));

  const totalOwed = youOwe.reduce((sum, s) => sum + s.amount, 0);
  const totalAreOwed = youAreOwed.reduce((sum, s) => sum + s.amount, 0);

  return {
    netBalance: Math.round((totalAreOwed - totalOwed) * 100) / 100,
    youOwe,
    youAreOwed,
    totalOwed: Math.round(totalOwed * 100) / 100,
    totalAreOwed: Math.round(totalAreOwed * 100) / 100,
  };
}
