import { TrendingDown, TrendingUp, Wallet, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card.js";
import { Button } from "@/components/ui/button.js";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar.js";
import { useGetGroupBalanceSummaryQuery } from "@/store/api/settlementsApi.js";
import { useMarkSettlementPaidMutation } from "@/store/api/settlementsApi.js";
import { formatCurrency, getInitials } from "@/lib/utils.js";
import { cn } from "@/lib/utils.js";

interface BalanceSummaryProps {
  groupId: string;
  currentUserId: string;
}

export function BalanceSummary({ groupId, currentUserId }: BalanceSummaryProps) {
  const { data, isLoading } = useGetGroupBalanceSummaryQuery(groupId);
  const [markPaid, { isLoading: isPaying }] = useMarkSettlementPaidMutation();

  const summary = data?.data;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (!summary) return null;

  const netIsPositive = summary.netBalance >= 0;

  return (
    <div className="space-y-4">
      {/* Net Balance Hero Card */}
      <div
        className={cn(
          "rounded-2xl p-5 text-white bg-gradient-to-br",
          netIsPositive
            ? "from-emerald-500 to-teal-600"
            : "from-rose-500 to-pink-600"
        )}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium opacity-90">Your net balance</p>
            <p className="text-3xl font-bold mt-1">
              {netIsPositive ? "+" : ""}
              {formatCurrency(Math.abs(summary.netBalance))}
            </p>
            <p className="text-sm opacity-80 mt-1">
              {netIsPositive
                ? "You are owed overall"
                : "You owe overall"}
            </p>
          </div>
          <div
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-2xl",
              netIsPositive ? "bg-emerald-400/30" : "bg-rose-400/30"
            )}
          >
            <Wallet className="h-7 w-7" />
          </div>
        </div>

        <div className="mt-4 flex gap-4">
          <div className="flex items-center gap-1.5 text-sm opacity-90">
            <TrendingUp className="h-4 w-4" />
            <span>Owed to you: {formatCurrency(summary.totalAreOwed)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm opacity-90">
            <TrendingDown className="h-4 w-4" />
            <span>You owe: {formatCurrency(summary.totalOwed)}</span>
          </div>
        </div>
      </div>

      {/* Per-Person Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* You Owe */}
        {summary.youOwe.length > 0 && (
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30">
                  <TrendingDown className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                </div>
                <h3 className="font-semibold text-sm text-rose-600 dark:text-rose-400">You owe</h3>
              </div>
              <div className="space-y-3">
                {summary.youOwe.map((item) => (
                  <div key={item.settlementId} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={item.user.avatar ?? undefined} />
                        <AvatarFallback className="text-xs">{getInitials(item.user.name)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium truncate">{item.user.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                        {formatCurrency(item.amount)}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        loading={isPaying}
                        className="h-7 text-xs px-2"
                        onClick={() => markPaid(item.settlementId)}
                      >
                        Pay
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Owed to You */}
        {summary.youAreOwed.length > 0 && (
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="font-semibold text-sm text-emerald-600 dark:text-emerald-400">Owed to you</h3>
              </div>
              <div className="space-y-3">
                {summary.youAreOwed.map((item) => (
                  <div key={item.settlementId} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={item.user.avatar ?? undefined} />
                        <AvatarFallback className="text-xs">{getInitials(item.user.name)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium truncate">{item.user.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <ArrowRight className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {summary.youOwe.length === 0 && summary.youAreOwed.length === 0 && (
          <div className="md:col-span-2 flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-3">
              <Wallet className="h-7 w-7 text-emerald-600" />
            </div>
            <p className="font-semibold text-foreground">All settled up!</p>
            <p className="text-sm text-muted-foreground mt-1">No outstanding balances in this group.</p>
          </div>
        )}
      </div>
    </div>
  );
}
