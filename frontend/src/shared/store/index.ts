import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

import { authReducer } from '../../features/auth/store/authSlice';
import { errorReducer } from '../errors/errorSlice';
import { api } from '../services/api';

import '../../features/auth/services/authApi';
import '../../features/user/services/userApi';
import '../../features/todo/services/todoApi';
import '../../features/challenge/services/challengeApi';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    error: errorReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
