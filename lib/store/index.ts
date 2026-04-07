import { configureStore } from '@reduxjs/toolkit';
import configReducer from './configSlice';
import dashboardReducer from './dashboardSlice';

export const store = configureStore({
  reducer: {
    config: configReducer,
    dashboard: dashboardReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
