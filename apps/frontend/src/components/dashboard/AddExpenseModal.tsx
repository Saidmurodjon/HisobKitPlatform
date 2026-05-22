import { useState } from "react";
import { Plus, SplitSquareHorizontal, Equal, DollarSign } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog.js";
import { Button } from "@/components/ui/button.js";
import { Input } from "@/components/ui/input.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.js";
import { useCreateExpenseMutation } from "@/store/api/expensesApi.js";
import { formatCurrency, getInitials, CATEGORY_LABELS } from "@/lib/utils.js";
import { cn } from "@/lib/utils.js";
import type { GroupMember, ExpenseCategory } from "@/types/index.js";

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  members: GroupMember[];
  currentUserId: string;
}

const CATEGORIES = Object.entries(CATEGORY_LABELS) as [ExpenseCategory, string][];

export function AddExpenseModal({ isOpen, onClose, groupId, members, currentUserId }: AddExpenseModalProps) {
  const [createExpense, { isLoading }] = useCreateExpenseMutation();

  const [description, setDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("OTHER");
  const [splitType, setSplitType] = useState<"EQUAL" | "EXACT">("EQUAL");
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(
    new Set(members.map((m) => m.userId))
  );
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const total = parseFloat(totalAmount) || 0;

  function toggleMember(userId: string) {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        if (next.size === 1) return prev; // must have at least one
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }

  const selectedMembers = members.filter((m) => selectedMemberIds.has(m.userId));
  const equalShare = selectedMembers.length > 0 ? total / selectedMembers.length : 0;

  const exactTotal = Object.values(exactAmounts).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  const exactRemaining = Math.round((total - exactTotal) * 100) / 100;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!description.trim()) return setError("Description is required");
    if (total <= 0) return setError("Amount must be greater than 0");
    if (selectedMembers.length === 0) return setError("Select at least one member");

    if (splitType === "EXACT") {
      if (Math.abs(exactRemaining) > 0.01) {
        return setError(`Split amounts don't add up. ${exactRemaining > 0 ? `${formatCurrency(exactRemaining)} unassigned` : `Over by ${formatCurrency(Math.abs(exactRemaining))}`}`);
      }
    }

    const splits =
      splitType === "EQUAL"
        ? selectedMembers.map((m) => ({ userId: m.userId }))
        : selectedMembers.map((m) => ({
            userId: m.userId,
            amount: parseFloat(exactAmounts[m.userId] ?? "0") || 0,
          }));

    try {
      await createExpense({
        groupId,
        description: description.trim(),
        totalAmount: total,
        category,
        splitType,
        splits,
        paidByUserId: currentUserId,
      }).unwrap();
      handleClose();
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: string } })?.data?.error ?? "Failed to create expense";
      setError(msg);
    }
  }

  function handleClose() {
    setDescription("");
    setTotalAmount("");
    setCategory("OTHER");
    setSplitType("EQUAL");
    setSelectedMemberIds(new Set(members.map((m) => m.userId)));
    setExactAmounts({});
    setError(null);
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Description"
            placeholder="Groceries, dinner, rent..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <Input
            label="Total Amount (UZS)"
            type="number"
            placeholder="0"
            min="1"
            step="100"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
            leftIcon={<DollarSign className="h-4 w-4" />}
          />

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Category</label>
            <Select value={category} onValueChange={(v) => setCategory(v as ExpenseCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Split type toggle */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Split method</label>
            <div className="flex rounded-lg border overflow-hidden">
              <button
                type="button"
                onClick={() => setSplitType("EQUAL")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors",
                  splitType === "EQUAL"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-muted-foreground"
                )}
              >
                <Equal className="h-4 w-4" />
                Equal
              </button>
              <button
                type="button"
                onClick={() => setSplitType("EXACT")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors",
                  splitType === "EXACT"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-muted-foreground"
                )}
              >
                <SplitSquareHorizontal className="h-4 w-4" />
                Exact
              </button>
            </div>
          </div>

          {/* Member selection + amounts */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Split among</label>
              {splitType === "EXACT" && total > 0 && (
                <span className={cn("text-xs font-medium", Math.abs(exactRemaining) < 0.01 ? "text-emerald-600" : "text-orange-500")}>
                  {Math.abs(exactRemaining) < 0.01
                    ? "Balanced"
                    : exactRemaining > 0
                    ? `${formatCurrency(exactRemaining)} left`
                    : `Over by ${formatCurrency(Math.abs(exactRemaining))}`}
                </span>
              )}
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {members.map((member) => {
                const selected = selectedMemberIds.has(member.userId);
                return (
                  <div
                    key={member.userId}
                    className={cn(
                      "flex items-center gap-3 rounded-xl p-2.5 cursor-pointer transition-colors border",
                      selected ? "bg-primary/5 border-primary/20" : "border-transparent hover:bg-muted/50"
                    )}
                    onClick={() => splitType === "EQUAL" && toggleMember(member.userId)}
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={member.user.avatar ?? undefined} />
                      <AvatarFallback className="text-xs">{getInitials(member.user.name)}</AvatarFallback>
                    </Avatar>

                    <span className="flex-1 text-sm font-medium">
                      {member.userId === currentUserId ? "You" : member.user.name}
                    </span>

                    {splitType === "EQUAL" ? (
                      <>
                        {total > 0 && selected && (
                          <span className="text-sm text-muted-foreground">
                            {formatCurrency(equalShare)}
                          </span>
                        )}
                        <div
                          className={cn(
                            "h-5 w-5 rounded-full border-2 flex items-center justify-center",
                            selected ? "border-primary bg-primary" : "border-muted-foreground"
                          )}
                        >
                          {selected && <div className="h-2.5 w-2.5 rounded-full bg-white" />}
                        </div>
                      </>
                    ) : (
                      <input
                        type="number"
                        placeholder="0"
                        min="0"
                        step="100"
                        className="w-28 h-8 text-sm text-right rounded-lg border border-input bg-background px-2 focus:outline-none focus:ring-2 focus:ring-ring"
                        value={exactAmounts[member.userId] ?? ""}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) =>
                          setExactAmounts((prev) => ({
                            ...prev,
                            [member.userId]: e.target.value,
                          }))
                        }
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" loading={isLoading}>
              <Plus className="h-4 w-4" />
              Add Expense
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
