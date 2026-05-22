import { CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp, Receipt } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card.js";
import { Badge } from "@/components/ui/badge.js";
import { Button } from "@/components/ui/button.js";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar.js";
import { useConfirmSplitMutation, useDisputeExpenseMutation } from "@/store/api/expensesApi.js";
import { formatCurrency, formatRelativeTime, getInitials, CATEGORY_LABELS, CATEGORY_COLORS } from "@/lib/utils.js";
import { cn } from "@/lib/utils.js";
import type { Expense } from "@/types/index.js";

interface ExpenseCardProps {
  expense: Expense;
  currentUserId: string;
}

const STATUS_CONFIG = {
  PENDING: { label: "Pending", variant: "pending" as const, icon: Clock },
  ACTIVE: { label: "Active", variant: "success" as const, icon: CheckCircle2 },
  REJECTED: { label: "Rejected", variant: "destructive" as const, icon: XCircle },
};

export function ExpenseCard({ expense, currentUserId }: ExpenseCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmSplit, { isLoading: isConfirming }] = useConfirmSplitMutation();
  const [disputeExpense, { isLoading: isDisputing }] = useDisputeExpenseMutation();

  const mySplt = expense.splits.find((s) => s.oweUserId === currentUserId);
  const isMyExpense = expense.paidByUserId === currentUserId;
  const statusConfig = STATUS_CONFIG[expense.status];
  const StatusIcon = statusConfig.icon;

  const categoryColor = CATEGORY_COLORS[expense.category] ?? "#6b7280";
  const pendingCount = expense.splits.filter(
    (s) => !s.isConfirmed && s.oweUserId !== expense.paidByUserId
  ).length;

  return (
    <Card className={cn("transition-all duration-200 hover:shadow-md", expense.status === "REJECTED" && "opacity-60")}>
      <CardContent className="p-4">
        {/* Header Row */}
        <div className="flex items-start gap-3">
          {/* Category indicator dot */}
          <div
            className="mt-0.5 h-10 w-10 shrink-0 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: categoryColor + "20" }}
          >
            <Receipt className="h-5 w-5" style={{ color: categoryColor }} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">{expense.description}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs text-muted-foreground">
                    {CATEGORY_LABELS[expense.category]}
                  </span>
                  <span className="text-muted-foreground text-xs">·</span>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(expense.createdAt)}
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="font-bold text-foreground">{formatCurrency(expense.totalAmount)}</p>
                <Badge variant={statusConfig.variant} className="mt-1 text-[10px]">
                  <StatusIcon className="h-2.5 w-2.5" />
                  {statusConfig.label}
                </Badge>
              </div>
            </div>

            {/* Paid by */}
            <div className="flex items-center gap-1.5 mt-2">
              <Avatar className="h-5 w-5">
                <AvatarImage src={expense.paidBy.avatar ?? undefined} />
                <AvatarFallback className="text-[9px]">{getInitials(expense.paidBy.name)}</AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">
                {isMyExpense ? "You paid" : `${expense.paidBy.name} paid`}
              </span>
              {expense.status === "PENDING" && pendingCount > 0 && (
                <span className="ml-auto text-xs text-orange-500 font-medium">
                  {pendingCount} pending
                </span>
              )}
            </div>
          </div>
        </div>

        {/* My split action */}
        {mySplt && !isMyExpense && expense.status === "PENDING" && !mySplt.isConfirmed && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-orange-50 dark:bg-orange-900/20 p-3">
            <div className="flex-1">
              <p className="text-xs font-medium text-orange-700 dark:text-orange-400">
                Your share: {formatCurrency(mySplt.amount)}
              </p>
              <p className="text-xs text-orange-600/80 dark:text-orange-500/80">Confirm or dispute this expense</p>
            </div>
            <div className="flex gap-1.5">
              <Button
                size="sm"
                variant="success"
                loading={isConfirming}
                className="h-8 text-xs"
                onClick={() => confirmSplit({ expenseId: expense.id, splitId: mySplt.id })}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Confirm
              </Button>
              <Button
                size="sm"
                variant="outline"
                loading={isDisputing}
                className="h-8 text-xs border-rose-200 text-rose-600 hover:bg-rose-50"
                onClick={() => disputeExpense({ expenseId: expense.id })}
              >
                <XCircle className="h-3.5 w-3.5" />
                Dispute
              </Button>
            </div>
          </div>
        )}

        {mySplt && !isMyExpense && mySplt.isConfirmed && expense.status === "PENDING" && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 p-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <p className="text-xs text-emerald-700 dark:text-emerald-400">
              You confirmed your share of {formatCurrency(mySplt.amount)}
            </p>
          </div>
        )}

        {/* Expand/collapse splits */}
        <button
          className="w-full mt-3 flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setExpanded((p) => !p)}
        >
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          {expanded ? "Hide" : "Show"} splits ({expense.splits.length})
        </button>

        {expanded && (
          <div className="mt-3 space-y-2 border-t pt-3">
            {expense.splits.map((split) => (
              <div key={split.id} className="flex items-center gap-2.5">
                <Avatar className="h-6 w-6 shrink-0">
                  <AvatarImage src={split.ower.avatar ?? undefined} />
                  <AvatarFallback className="text-[10px]">{getInitials(split.ower.name)}</AvatarFallback>
                </Avatar>
                <span className="flex-1 text-sm text-foreground truncate">
                  {split.oweUserId === currentUserId ? "You" : split.ower.name}
                </span>
                <span className="text-sm font-medium">{formatCurrency(split.amount)}</span>
                {split.isConfirmed ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                ) : (
                  <Clock className="h-4 w-4 text-orange-400 shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
