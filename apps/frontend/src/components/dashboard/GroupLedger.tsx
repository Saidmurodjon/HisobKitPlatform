import { useState } from "react";
import {
  Plus,
  Users,
  Filter,
  RefreshCw,
  Copy,
  Check,
  BarChart3,
  ListTodo,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button.js";
import { Badge } from "@/components/ui/badge.js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.js";
import { BalanceSummary } from "./BalanceSummary.js";
import { ExpenseCard } from "./ExpenseCard.js";
import { AddExpenseModal } from "./AddExpenseModal.js";
import { AnalyticsPanel } from "./AnalyticsPanel.js";
import { useGetGroupByIdQuery } from "@/store/api/groupsApi.js";
import { useGetGroupExpensesQuery } from "@/store/api/expensesApi.js";
import { useRecalculateSettlementsMutation } from "@/store/api/settlementsApi.js";
import { formatRelativeTime, getInitials, GROUP_TYPE_LABELS } from "@/lib/utils.js";
import { cn } from "@/lib/utils.js";
import type { ExpenseStatus } from "@/types/index.js";

interface GroupLedgerProps {
  groupId: string;
  currentUserId: string;
}

type TabId = "expenses" | "balances" | "analytics";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "expenses", label: "Expenses", icon: ListTodo },
  { id: "balances", label: "Balances", icon: Wallet },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
];

export function GroupLedger({ groupId, currentUserId }: GroupLedgerProps) {
  const [activeTab, setActiveTab] = useState<TabId>("expenses");
  const [statusFilter, setStatusFilter] = useState<ExpenseStatus | "ALL">("ALL");
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [page, setPage] = useState(1);

  const { data: groupData, isLoading: groupLoading } = useGetGroupByIdQuery(groupId);
  const { data: expensesData, isLoading: expensesLoading, isFetching } = useGetGroupExpensesQuery({
    groupId,
    ...(statusFilter !== "ALL" && { status: statusFilter }),
    page,
    limit: 20,
  });
  const [recalculate, { isLoading: isRecalculating }] = useRecalculateSettlementsMutation();

  const group = groupData?.data;
  const expensePagination = expensesData?.data;
  const expenses = expensePagination?.data ?? [];

  async function copyInviteLink() {
    if (!group) return;
    const link = `${window.location.origin}/join/${group.inviteCode}`;
    await navigator.clipboard.writeText(link);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  }

  if (groupLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-32 rounded-2xl bg-muted" />
        <div className="h-10 rounded-xl bg-muted" />
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-24 rounded-xl bg-muted" />)}
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Users className="h-12 w-12 text-muted-foreground mb-3" />
        <p className="font-semibold text-foreground">Group not found</p>
        <p className="text-sm text-muted-foreground">This group may have been deleted.</p>
      </div>
    );
  }

  const displayedMembers = group.members.slice(0, 5);
  const extraMembers = group.members.length - displayedMembers.length;

  return (
    <div className="flex flex-col gap-5">
      {/* Group Header */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-5 text-white shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs">
                {GROUP_TYPE_LABELS[group.type]}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold truncate">{group.name}</h1>
            {group.description && (
              <p className="text-sm opacity-80 mt-0.5 line-clamp-1">{group.description}</p>
            )}
            <p className="text-xs opacity-70 mt-1">
              Created {formatRelativeTime(group.createdAt)} · {group._count?.expenses ?? 0} expenses
            </p>
          </div>

          <Button
            size="sm"
            variant="ghost"
            className="bg-white/20 hover:bg-white/30 text-white border-0 shrink-0"
            onClick={copyInviteLink}
          >
            {copiedInvite ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copiedInvite ? "Copied!" : "Invite"}
          </Button>
        </div>

        {/* Member Avatars */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex -space-x-2">
              {displayedMembers.map((m) => (
                <Avatar key={m.userId} className="h-8 w-8 ring-2 ring-white/40">
                  <AvatarImage src={m.user.avatar ?? undefined} />
                  <AvatarFallback className="text-xs bg-indigo-600">{getInitials(m.user.name)}</AvatarFallback>
                </Avatar>
              ))}
              {extraMembers > 0 && (
                <div className="h-8 w-8 rounded-full bg-white/20 ring-2 ring-white/40 flex items-center justify-center text-xs font-semibold">
                  +{extraMembers}
                </div>
              )}
            </div>
            <span className="ml-2.5 text-sm opacity-80">{group.members.length} members</span>
          </div>

          <Button
            size="sm"
            onClick={() => setIsAddExpenseOpen(true)}
            className="bg-white text-indigo-600 hover:bg-white/90 font-semibold shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex rounded-xl border bg-muted/30 p-1 gap-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "expenses" && (
        <div className="space-y-4">
          {/* Filters + Recalculate */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v as ExpenseStatus | "ALL");
                setPage(1);
              }}
            >
              <SelectTrigger className="w-36 h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Button
              size="sm"
              variant="outline"
              loading={isRecalculating}
              className="ml-auto h-9"
              onClick={() => recalculate(groupId)}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Recalculate</span>
            </Button>
          </div>

          {/* Expense list */}
          {expensesLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed rounded-2xl">
              <ListTodo className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="font-semibold text-foreground">No expenses yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add the first expense to start tracking debts.
              </p>
              <Button
                className="mt-4"
                size="sm"
                onClick={() => setIsAddExpenseOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Add Expense
              </Button>
            </div>
          ) : (
            <div className={cn("space-y-3 transition-opacity", isFetching && "opacity-60")}>
              {expenses.map((expense) => (
                <ExpenseCard
                  key={expense.id}
                  expense={expense}
                  currentUserId={currentUserId}
                />
              ))}

              {/* Pagination */}
              {expensePagination && expensePagination.total > 20 && (
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm text-muted-foreground">
                    {(page - 1) * 20 + 1}–{Math.min(page * 20, expensePagination.total)} of{" "}
                    {expensePagination.total}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!expensePagination.hasMore}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === "balances" && (
        <BalanceSummary groupId={groupId} currentUserId={currentUserId} />
      )}

      {activeTab === "analytics" && <AnalyticsPanel groupId={groupId} />}

      {/* Add Expense Modal */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        groupId={groupId}
        members={group.members}
        currentUserId={currentUserId}
      />
    </div>
  );
}
