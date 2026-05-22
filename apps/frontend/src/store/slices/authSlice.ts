import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { User } from "../../types/index.js";
import { authApi } from "../api/authApi.js";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
}

const TOKEN_KEY = "hisobkit_token";

function loadToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

const initialState: AuthState = {
  user: null,
  token: loadToken(),
  isAuthenticated: false,
  isInitializing: true,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.isInitializing = false;
      try {
        localStorage.setItem(TOKEN_KEY, action.payload.token);
      } catch {
        // storage unavailable
      }
    },

    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isInitializing = false;
      try {
        localStorage.removeItem(TOKEN_KEY);
      } catch {
        // storage unavailable
      }
    },

    setInitializingDone: (state) => {
      state.isInitializing = false;
    },
  },
  extraReducers: (builder) => {
    // Automatically hydrate user & token from login mutations.
    builder
      .addMatcher(authApi.endpoints.loginWithGoogle.matchFulfilled, (state, action) => {
        const { token, user } = (action.payload.data ?? {}) as { token: string; user: User };
        if (token && user) {
          state.user = user;
          state.token = token;
          state.isAuthenticated = true;
          state.isInitializing = false;
          try {
            localStorage.setItem(TOKEN_KEY, token);
          } catch {
            // storage unavailable
          }
        }
      })
      .addMatcher(authApi.endpoints.loginWithTelegram.matchFulfilled, (state, action) => {
        const { token, user } = (action.payload.data ?? {}) as { token: string; user: User };
        if (token && user) {
          state.user = user;
          state.token = token;
          state.isAuthenticated = true;
          state.isInitializing = false;
          try {
            localStorage.setItem(TOKEN_KEY, token);
          } catch {
            // storage unavailable
          }
        }
      })
      .addMatcher(authApi.endpoints.getMe.matchFulfilled, (state, action) => {
        if (action.payload.data) {
          state.user = action.payload.data;
          state.isAuthenticated = true;
          state.isInitializing = false;
        }
      })
      .addMatcher(authApi.endpoints.getMe.matchRejected, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.isInitializing = false;
        try {
          localStorage.removeItem(TOKEN_KEY);
        } catch {
          // storage unavailable
        }
      });
  },
});

export const { setCredentials, logout, setInitializingDone } = authSlice.actions;
export default authSlice.reducer;
