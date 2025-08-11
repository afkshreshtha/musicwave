
import { configureStore } from '@reduxjs/toolkit';
import { musicApi } from '@/redux/features/api/musicApi';
import musicPlayerReducer from '@/redux/features/musicPlayerSlice';

export const store = configureStore({
  reducer: {
    [musicApi.reducerPath]: musicApi.reducer,
    player:musicPlayerReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(musicApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
