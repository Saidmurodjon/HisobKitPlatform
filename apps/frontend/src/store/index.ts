import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "./api/baseApi.js";
import authReducer from "./slices/authSlice.js";
import expenseReducer from "./slices/expenseSlice.js";

// Eagerly import all injected endpoint modules so RTK Query registers them.
import "./api/authApi.js";
import "./api/groupsApi.js";
import "./api/expensesApi.js";
import "./api/settlementsApi.js";
import "./api/notificationsApi.js";

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    auth: authReducer,
    expense: expenseReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
  devTools: import.meta.env.DEV,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
