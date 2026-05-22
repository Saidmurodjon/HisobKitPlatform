import { baseApi } from "./baseApi.js";
import type {
  Expense,
  ExpenseCategory,
  ExpenseStatus,
  SplitType,
  ApiResponse,
  PaginatedResponse,
  GroupAnalytics,
} from "../../types/index.js";

interface CreateExpenseInput {
  groupId: string;
  paidByUserId?: string;
  totalAmount: number;
  description: string;
  category?: ExpenseCategory;
  splitType?: SplitType;
  splits?: Array<{ userId: string; amount?: number }>;
  notes?: string;
}

interface ExpenseListParams {
  groupId: string;
  status?: ExpenseStatus;
  category?: ExpenseCategory;
  page?: number;
  limit?: number;
}

export const expensesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getGroupExpenses: builder.query<ApiResponse<PaginatedResponse<Expense>>, ExpenseListParams>({
      query: ({ groupId, ...params }) => ({
        url: `/expenses/group/${groupId}`,
        params,
      }),
      providesTags: (_result, _err, { groupId }) => [
        { type: "Expense", id: `GROUP_${groupId}` },
      ],
    }),

    getExpenseById: builder.query<ApiResponse<Expense>, string>({
      query: (id) => `/expenses/${id}`,
      providesTags: (_result, _err, id) => [{ type: "Expense", id }],
    }),

    createExpense: builder.mutation<ApiResponse<Expense>, CreateExpenseInput>({
      query: (body) => ({ url: "/expenses", method: "POST", body }),
      invalidatesTags: (_result, _err, { groupId }) => [
        { type: "Expense", id: `GROUP_${groupId}` },
        { type: "Balance", id: groupId },
        { type: "Settlement", id: groupId },
        { type: "Notification", id: "LIST" },
      ],
    }),

    confirmSplit: builder.mutation<
      ApiResponse<{ confirmed: boolean; expenseActivated: boolean }>,
      { expenseId: string; splitId: string }
    >({
      query: ({ expenseId, splitId }) => ({
        url: `/expenses/${expenseId}/splits/${splitId}/confirm`,
        method: "POST",
      }),
      invalidatesTags: (_result, _err, { expenseId }) => [
        { type: "Expense", id: expenseId },
        "Balance",
        "Settlement",
        "Notification",
      ],
    }),

    disputeExpense: builder.mutation<
      ApiResponse<{ disputed: boolean }>,
      { expenseId: string; reason?: string }
    >({
      query: ({ expenseId, reason }) => ({
        url: `/expenses/${expenseId}/dispute`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: (_result, _err, { expenseId }) => [
        { type: "Expense", id: expenseId },
        "Notification",
      ],
    }),

    getGroupAnalytics: builder.query<
      ApiResponse<GroupAnalytics>,
      { groupId: string; period?: "week" | "month" | "year" }
    >({
      query: ({ groupId, period = "month" }) => ({
        url: `/expenses/group/${groupId}/analytics`,
        params: { period },
      }),
      providesTags: (_result, _err, { groupId }) => [{ type: "Analytics", id: groupId }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetGroupExpensesQuery,
  useGetExpenseByIdQuery,
  useCreateExpenseMutation,
  useConfirmSplitMutation,
  useDisputeExpenseMutation,
  useGetGroupAnalyticsQuery,
} = expensesApi;
