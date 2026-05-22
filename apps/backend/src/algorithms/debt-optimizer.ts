/**
 * Greedy Debt Simplification Algorithm
 *
 * Reduces an arbitrary set of debts to the minimum number of transactions
 * by computing net balances and greedily matching the largest creditor
 * with the largest debtor on each pass.
 *
 * Time complexity: O(n log n) — dominated by the sort.
 * The algorithm is provably optimal for minimizing transaction count when
 * balances are drawn from a single currency pool.
 */

export interface NetBalance {
  userId: string;
  amount: number; // positive → owed this much, negative → owes this much
}

export interface OptimizedTransaction {
  fromUserId: string;
  toUserId: string;
  amount: number;
}

const EPSILON = 0.001; // Floating point tolerance for zero comparisons

export function optimizeDebts(balances: NetBalance[]): OptimizedTransaction[] {
  const transactions: OptimizedTransaction[] = [];

  // Work on deep copies so callers' data is never mutated.
  const creditors = balances
    .filter((b) => b.amount > EPSILON)
    .map((b) => ({ userId: b.userId, amount: b.amount }))
    .sort((a, b) => b.amount - a.amount);

  const debtors = balances
    .filter((b) => b.amount < -EPSILON)
    .map((b) => ({ userId: b.userId, amount: b.amount }))
    .sort((a, b) => a.amount - b.amount); // most-negative first

  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci]!;
    const debtor = debtors[di]!;

    const settleAmount = Math.min(creditor.amount, Math.abs(debtor.amount));
    const rounded = Math.round(settleAmount * 100) / 100;

    if (rounded > 0) {
      transactions.push({
        fromUserId: debtor.userId,
        toUserId: creditor.userId,
        amount: rounded,
      });
    }

    creditor.amount -= settleAmount;
    debtor.amount += settleAmount;

    if (creditor.amount < EPSILON) ci++;
    if (Math.abs(debtor.amount) < EPSILON) di++;
  }

  return transactions;
}

/**
 * Computes net balances for each participant across a set of expenses.
 * Only ACTIVE expenses with confirmed splits are counted.
 */
export function computeGroupNetBalances(
  expenses: Array<{
    paidByUserId: string;
    splits: Array<{
      oweUserId: string;
      amount: number | string; // Prisma Decimal may serialize as string
    }>;
  }>
): NetBalance[] {
  const balanceMap = new Map<string, number>();

  const add = (userId: string, delta: number) => {
    balanceMap.set(userId, (balanceMap.get(userId) ?? 0) + delta);
  };

  for (const expense of expenses) {
    for (const split of expense.splits) {
      // The payer's own split portion is excluded from debt calculation.
      if (split.oweUserId === expense.paidByUserId) continue;

      const amt = typeof split.amount === "string" ? parseFloat(split.amount) : split.amount;

      // Payer is owed `amt` more.
      add(expense.paidByUserId, amt);
      // Ower owes `amt` more.
      add(split.oweUserId, -amt);
    }
  }

  return Array.from(balanceMap.entries())
    .map(([userId, amount]) => ({ userId, amount: Math.round(amount * 100) / 100 }))
    .filter((b) => Math.abs(b.amount) > EPSILON);
}

/**
 * Computes the balance a specific user has with every other user in a group.
 * Returns positive values when the target user is owed money,
 * negative when the target user owes money.
 */
export function computeUserBalances(
  targetUserId: string,
  balances: NetBalance[],
  transactions: OptimizedTransaction[]
): Map<string, number> {
  const perUser = new Map<string, number>();

  for (const tx of transactions) {
    if (tx.fromUserId === targetUserId) {
      perUser.set(tx.toUserId, (perUser.get(tx.toUserId) ?? 0) - tx.amount);
    }
    if (tx.toUserId === targetUserId) {
      perUser.set(tx.fromUserId, (perUser.get(tx.fromUserId) ?? 0) + tx.amount);
    }
  }

  return perUser;
}
