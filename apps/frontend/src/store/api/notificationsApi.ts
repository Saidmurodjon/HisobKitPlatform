import { baseApi } from "./baseApi.js";
import type { Notification, ApiResponse, PaginatedResponse } from "../../types/index.js";

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<
      ApiResponse<PaginatedResponse<Notification>>,
      { unreadOnly?: boolean; page?: number; limit?: number }
    >({
      query: (params) => ({ url: "/notifications", params }),
      providesTags: [{ type: "Notification", id: "LIST" }],
    }),

    getUnreadCount: builder.query<ApiResponse<{ count: number }>, void>({
      query: () => "/notifications/unread-count",
      providesTags: [{ type: "Notification", id: "COUNT" }],
    }),

    markNotificationRead: builder.mutation<ApiResponse<Notification>, string>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: "POST" }),
      invalidatesTags: [
        { type: "Notification", id: "LIST" },
        { type: "Notification", id: "COUNT" },
      ],
    }),

    markAllNotificationsRead: builder.mutation<ApiResponse<{ updated: number }>, void>({
      query: () => ({ url: "/notifications/read-all", method: "POST" }),
      invalidatesTags: [
        { type: "Notification", id: "LIST" },
        { type: "Notification", id: "COUNT" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = notificationsApi;
