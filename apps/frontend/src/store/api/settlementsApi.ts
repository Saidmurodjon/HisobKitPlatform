import { baseApi } from "./baseApi.js";
import type { Settlement, BalanceSummary, ApiResponse } from "../../types/index.js";

export const settlementsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getGroupSettlements: builder.query<ApiResponse<Settlement[]>, string>({
      query: (groupId) => `/settlements/group/${groupId}`,
      providesTags: (_result, _err, groupId) => [{ type: "Settlement", id: groupId }],
    }),

    getGroupBalanceSummary: builder.query<ApiResponse<BalanceSummary>, string>({
      query: (groupId) => `/settlements/group/${groupId}/balance`,
      providesTags: (_result, _err, groupId) => [{ type: "Balance", id: groupId }],
    }),

    markSettlementPaid: builder.mutation<ApiResponse<Settlement>, string>({
      query: (settlementId) => ({
        url: `/settlements/${settlementId}/pay`,
        method: "POST",
      }),
      invalidatesTags: ["Settlement", "Balance"],
    }),

    recalculateSettlements: builder.mutation<ApiResponse, string>({
      query: (groupId) => ({
        url: `/settlements/group/${groupId}/recalculate`,
        method: "POST",
      }),
      invalidatesTags: ["Settlement", "Balance"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetGroupSettlementsQuery,
  useGetGroupBalanceSummaryQuery,
  useMarkSettlementPaidMutation,
  useRecalculateSettlementsMutation,
} = settlementsApi;
