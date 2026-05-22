// ─── Auth ─────────────────────────────────────────────────────────────────────

export type AuthProvider = "GOOGLE" | "TELEGRAM";
export type Role = "USER" | "ADMIN";

export interface User {
  id: string;
  name: string;
  email: string | null;
  telegramId: string | null;
  avatar: string | null;
  role: Role;
  authProvider: AuthProvider;
  createdAt: string;
}

// ─── Groups ───────────────────────────────────────────────────────────────────

export type GroupType = "FLATMATES" | "COWORKERS" | "FRIENDS" | "TRIP" | "FAMILY" | "OTHER";
export type GroupMemberRole = "OWNER" | "ADMIN" | "MEMBER";

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: GroupMemberRole;
  joinedAt: string;
  user: Pick<User, "id" | "name" | "avatar" | "email">;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  type: GroupType;
  inviteCode: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  members: GroupMember[];
  _count?: { expenses: number };
}

// ─── Expenses ────────────────────────────────────────────────────────────────

export type ExpenseStatus = "PENDING" | "ACTIVE" | "REJECTED";
export type ExpenseCategory =
  | "FOOD"
  | "RENT"
  | "UTILITIES"
  | "ENTERTAINMENT"
  | "TRANSPORT"
  | "HEALTHCARE"
  | "SHOPPING"
  | "TRAVEL"
  | "OTHER";
export type SplitType = "EQUAL" | "EXACT";

export interface ExpenseSplit {
  id: string;
  expenseId: string;
  oweUserId: string;
  amount: string; // Prisma Decimal serialised as string
  isConfirmed: boolean;
  confirmedAt: string | null;
  ower: Pick<User, "id" | "name" | "avatar">;
}

export interface Expense {
  id: string;
  groupId: string;
  paidByUserId: string;
  totalAmount: string;
  description: string;
  category: ExpenseCategory;
  splitType: SplitType;
  status: ExpenseStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  paidBy: Pick<User, "id" | "name" | "avatar">;
  splits: ExpenseSplit[];
}

// ─── Settlements ──────────────────────────────────────────────────────────────

export type SettlementStatus = "PENDING" | "COMPLETED" | "CANCELLED";

export interface Settlement {
  id: string;
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amount: string;
  isPaid: boolean;
  status: SettlementStatus;
  paidAt: string | null;
  createdAt: string;
  fromUser: Pick<User, "id" | "name" | "avatar">;
  toUser: Pick<User, "id" | "name" | "avatar">;
}

export interface BalanceSummary {
  netBalance: number;
  totalOwed: number;
  totalAreOwed: number;
  youOwe: Array<{ user: Pick<User, "id" | "name" | "avatar">; amount: number; settlementId: string }>;
  youAreOwed: Array<{ user: Pick<User, "id" | "name" | "avatar">; amount: number; settlementId: string }>;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export type NotificationType =
  | "EXPENSE_ADDED"
  | "EXPENSE_CONFIRMED"
  | "EXPENSE_REJECTED"
  | "SETTLEMENT_REQUEST"
  | "SETTLEMENT_COMPLETED"
  | "GROUP_INVITE"
  | "SYSTEM";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  metaData: Record<string, unknown> | null;
  createdAt: string;
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface GroupAnalytics {
  period: "week" | "month" | "year";
  totalSpent: number;
  expenseCount: number;
  byCategory: Record<ExpenseCategory, number>;
}
