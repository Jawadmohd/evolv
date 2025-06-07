import { createSlice, PayloadAction, nanoid } from '@reduxjs/toolkit';

export type AppError = {
  id: string;
  message: string;
};

type ErrorState = {
  current: AppError | null;
};

const initialState: ErrorState = {
  current: null,
};

const errorSlice = createSlice({
  name: 'error',
  initialState,
  reducers: {
    showError: {
      reducer: (state, action: PayloadAction<AppError>) => {
        state.current = action.payload;
      },
      prepare: (message: string) => ({
        payload: {
          id: nanoid(),
          message,
        },
      }),
    },
    clearError: (state) => {
      state.current = null;
    },
  },
});

export const { showError, clearError } = errorSlice.actions;
export const errorReducer = errorSlice.reducer;
