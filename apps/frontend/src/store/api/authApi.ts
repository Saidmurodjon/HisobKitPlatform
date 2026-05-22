import { baseApi } from "./baseApi.js";
import type { User, ApiResponse } from "../../types/index.js";

interface AuthResponse {
  token: string;
  user: User;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    loginWithGoogle: builder.mutation<ApiResponse<AuthResponse>, { idToken: string }>({
      query: (body) => ({ url: "/auth/google", method: "POST", body }),
      invalidatesTags: ["User"],
    }),

    loginWithTelegram: builder.mutation<ApiResponse<AuthResponse>, { initData: string }>({
      query: (body) => ({ url: "/auth/telegram", method: "POST", body }),
      invalidatesTags: ["User"],
    }),

    getMe: builder.query<ApiResponse<User>, void>({
      query: () => "/auth/me",
      providesTags: ["User"],
    }),
  }),
  overrideExisting: false,
});

export const { useLoginWithGoogleMutation, useLoginWithTelegramMutation, useGetMeQuery } = authApi;
