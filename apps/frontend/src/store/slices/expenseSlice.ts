import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ExpenseCategory, SplitType } from "../../types/index.js";

// Holds transient UI state for the expense creation flow.
// Persisted server state lives in RTK Query cache.

interface SplitEntry {
  userId: string;
  amount?: number;
}

interface AddExpenseFormState {
  isOpen: boolean;
  groupId: string | null;
  description: string;
  totalAmount: string;
  category: ExpenseCategory;
  splitType: SplitType;
  splits: SplitEntry[];
  paidByUserId: string | null;
  notes: string;
  isSubmitting: boolean;
}

interface ExpenseUIState {
  selectedExpenseId: string | null;
  addExpenseForm: AddExpenseFormState;
  activeGroupId: string | null;
  confirmingExpenseId: string | null;
  disputeExpenseId: string | null;
}

const defaultForm: AddExpenseFormState = {
  isOpen: false,
  groupId: null,
  description: "",
  totalAmount: "",
  category: "OTHER",
  splitType: "EQUAL",
  splits: [],
  paidByUserId: null,
  notes: "",
  isSubmitting: false,
};

const initialState: ExpenseUIState = {
  selectedExpenseId: null,
  addExpenseForm: defaultForm,
  activeGroupId: null,
  confirmingExpenseId: null,
  disputeExpenseId: null,
};

export const expenseSlice = createSlice({
  name: "expense",
  initialState,
  reducers: {
    openAddExpenseModal: (state, action: PayloadAction<{ groupId: string; paidByUserId: string }>) => {
      state.addExpenseForm = {
        ...defaultForm,
        isOpen: true,
        groupId: action.payload.groupId,
        paidByUserId: action.payload.paidByUserId,
      };
    },

    closeAddExpenseModal: (state) => {
      state.addExpenseForm = defaultForm;
    },

    updateExpenseForm: (state, action: PayloadAction<Partial<Omit<AddExpenseFormState, "isOpen" | "isSubmitting">>>) => {
      Object.assign(state.addExpenseForm, action.payload);
    },

    setSplits: (state, action: PayloadAction<SplitEntry[]>) => {
      state.addExpenseForm.splits = action.payload;
    },

    setSubmitting: (state, action: PayloadAction<boolean>) => {
      state.addExpenseForm.isSubmitting = action.payload;
    },

    setActiveGroupId: (state, action: PayloadAction<string | null>) => {
      state.activeGroupId = action.payload;
    },

    setSelectedExpenseId: (state, action: PayloadAction<string | null>) => {
      state.selectedExpenseId = action.payload;
    },

    setConfirmingExpenseId: (state, action: PayloadAction<string | null>) => {
      state.confirmingExpenseId = action.payload;
    },

    setDisputeExpenseId: (state, action: PayloadAction<string | null>) => {
      state.disputeExpenseId = action.payload;
    },
  },
});

export const {
  openAddExpenseModal,
  closeAddExpenseModal,
  updateExpenseForm,
  setSplits,
  setSubmitting,
  setActiveGroupId,
  setSelectedExpenseId,
  setConfirmingExpenseId,
  setDisputeExpenseId,
} = expenseSlice.actions;

export default expenseSlice.reducer;
