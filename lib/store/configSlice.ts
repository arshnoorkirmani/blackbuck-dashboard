import { createSlice, createAsyncThunk, PayloadAction, ActionReducerMapBuilder } from '@reduxjs/toolkit';
import { ConfigService, FormConfig, DEFAULT_CONFIG } from '@/lib/services/config.service';
import { DashboardConfig, DEFAULT_DASHBOARD_CONFIG } from '@/lib/types/dashboard';

// ─── State ────────────────────────────────────────────────────────────────────

interface ConfigState {
  // Form config (per-user)
  data: FormConfig;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  lastFetchedEmail: string | null;

  // Dashboard config (global, admin-managed)
  dashboardConfig: DashboardConfig;
  dashboardConfigStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
}

const initialState: ConfigState = {
  data: DEFAULT_CONFIG,
  status: 'idle',
  error: null,
  lastFetchedEmail: null,
  dashboardConfig: DEFAULT_DASHBOARD_CONFIG,
  dashboardConfigStatus: 'idle',
};

// ─── Thunks — Form Config ─────────────────────────────────────────────────────

export const fetchConfig = createAsyncThunk(
  'config/fetchConfig',
  async (email: string) => {
    const config = await ConfigService.getUserConfig(email);
    return { email, config };
  }
);

export const saveDatabaseConfig = createAsyncThunk(
  'config/saveDatabaseConfig',
  async ({ email, config }: { email: string; config: FormConfig }) => {
    const success = await ConfigService.saveUserConfig(email, config);
    if (!success) throw new Error("Failed to save config database");
    return { email, config };
  }
);

// ─── Thunks — Dashboard Config ────────────────────────────────────────────────

export const fetchDashboardConfig = createAsyncThunk(
  'config/fetchDashboardConfig',
  async () => {
    return await ConfigService.getDashboardConfig();
  }
);

export const saveDashboardConfig = createAsyncThunk(
  'config/saveDashboardConfig',
  async (config: DashboardConfig) => {
    const success = await ConfigService.saveDashboardConfig(config);
    if (!success) throw new Error("Failed to save dashboard config");
    return config;
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    updateLocalConfig: (state, action: PayloadAction<FormConfig>) => {
      state.data = action.payload;
    },
    resetConfigToDefault: (state) => {
      state.data = DEFAULT_CONFIG;
    },
    updateLocalDashboardConfig: (state, action: PayloadAction<DashboardConfig>) => {
      state.dashboardConfig = action.payload;
    },
  },
  extraReducers: (builder: ActionReducerMapBuilder<ConfigState>) => {
    builder
      // Form config
      .addCase(fetchConfig.pending, (state) => {
        if (state.status === 'idle') state.status = 'loading';
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
      })

      // Dashboard config
      .addCase(fetchDashboardConfig.pending, (state) => {
        state.dashboardConfigStatus = 'loading';
      })
      .addCase(fetchDashboardConfig.fulfilled, (state, action) => {
        state.dashboardConfigStatus = 'succeeded';
        state.dashboardConfig = action.payload;
      })
      .addCase(fetchDashboardConfig.rejected, (state) => {
        state.dashboardConfigStatus = 'failed';
      })
      .addCase(saveDashboardConfig.fulfilled, (state, action) => {
        state.dashboardConfig = action.payload;
      });
  },
});

export const { updateLocalConfig, resetConfigToDefault, updateLocalDashboardConfig } = configSlice.actions;
export default configSlice.reducer;
