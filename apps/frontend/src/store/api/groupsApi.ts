import { baseApi } from "./baseApi.js";
import type { Group, GroupType, ApiResponse } from "../../types/index.js";

export const groupsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getGroups: builder.query<ApiResponse<Group[]>, void>({
      query: () => "/groups",
      providesTags: (result) =>
        result?.data
          ? [...result.data.map(({ id }) => ({ type: "Group" as const, id })), { type: "Group", id: "LIST" }]
          : [{ type: "Group", id: "LIST" }],
    }),

    getGroupById: builder.query<ApiResponse<Group>, string>({
      query: (id) => `/groups/${id}`,
      providesTags: (_result, _err, id) => [{ type: "Group", id }],
    }),

    createGroup: builder.mutation<
      ApiResponse<Group>,
      { name: string; description?: string; type?: GroupType }
    >({
      query: (body) => ({ url: "/groups", method: "POST", body }),
      invalidatesTags: [{ type: "Group", id: "LIST" }],
    }),

    updateGroup: builder.mutation<
      ApiResponse<Group>,
      { id: string; name?: string; description?: string; type?: GroupType }
    >({
      query: ({ id, ...body }) => ({ url: `/groups/${id}`, method: "PUT", body }),
      invalidatesTags: (_result, _err, { id }) => [{ type: "Group", id }],
    }),

    joinGroupByInviteCode: builder.mutation<ApiResponse<Group>, string>({
      query: (inviteCode) => ({ url: `/groups/join/${inviteCode}`, method: "POST" }),
      invalidatesTags: [{ type: "Group", id: "LIST" }],
    }),

    removeMember: builder.mutation<ApiResponse, { groupId: string; memberId: string }>({
      query: ({ groupId, memberId }) => ({
        url: `/groups/${groupId}/members/${memberId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _err, { groupId }) => [{ type: "Group", id: groupId }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetGroupsQuery,
  useGetGroupByIdQuery,
  useCreateGroupMutation,
  useUpdateGroupMutation,
  useJoinGroupByInviteCodeMutation,
  useRemoveMemberMutation,
} = groupsApi;
