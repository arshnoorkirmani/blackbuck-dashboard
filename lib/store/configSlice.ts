import { createSlice, createAsyncThunk, PayloadAction, ActionReducerMapBuilder } from '@reduxjs/toolkit';
import { ConfigService, FormConfig, DEFAULT_CONFIG } from '@/lib/services/config.service';

interface ConfigState {
  data: FormConfig;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  lastFetchedEmail: string | null;
}

const initialState: ConfigState = {
  data: DEFAULT_CONFIG,
  status: 'idle',
  error: null,
  lastFetchedEmail: null,
};

// Async Thunk to fetch config precisely once per session caching permanently in memory
export const fetchConfig = createAsyncThunk(
  'config/fetchConfig',
  async (email: string) => {
    const config = await ConfigService.getUserConfig(email);
    return { email, config };
  }
);

// Async Thunk pushing UI updates confidently to DB whilst resolving locally natively
export const saveDatabaseConfig = createAsyncThunk(
  'config/saveDatabaseConfig',
  async ({ email, config }: { email: string; config: FormConfig }) => {
    const success = await ConfigService.saveUserConfig(email, config);
    if (!success) throw new Error("Failed to save config database");
    return { email, config };
  }
);

const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    // Optimistic Local Updates guaranteeing zero-latency feedback loops in Settings Editor UI
    updateLocalConfig: (state, action: PayloadAction<FormConfig>) => {
      state.data = action.payload;
    },
    resetConfigToDefault: (state) => {
      state.data = DEFAULT_CONFIG;
    }
  },
  extraReducers: (builder: ActionReducerMapBuilder<ConfigState>) => {
    builder
      .addCase(fetchConfig.pending, (state) => {
        if (state.status === 'idle') {
            state.status = 'loading';
        }
      })
      .addCase(fetchConfig.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload.config;
        state.lastFetchedEmail = action.payload.email;
      })
      .addCase(fetchConfig.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to initialize config';
      })
      .addCase(saveDatabaseConfig.fulfilled, (state, action) => {
        state.data = action.payload.config;
      });
  },
});

export const { updateLocalConfig, resetConfigToDefault } = configSlice.actions;
export default configSlice.reducer;
