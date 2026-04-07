import type { DashboardConfig } from "@/lib/types/dashboard";
import { DEFAULT_DASHBOARD_CONFIG } from "@/lib/types/dashboard";

export type { DashboardConfig };

// ─── Form Config ──────────────────────────────────────────────────────────────

export type FormConfig = {
  visibleFields: {
    noOfTrucks: boolean;
    fuelingPotential: boolean;
    fuelingFrequency: boolean;
  };
  options: {
    omcs: string[];
    callStatuses: string[];
    interestedStatuses: string[];
    plans: string[];
    notInterestedReasons: string[];
  };
  actionMapping: Record<string, string>;
};

export const DEFAULT_CONFIG: FormConfig = {
  visibleFields: {
    noOfTrucks: true,
    fuelingPotential: true,
    fuelingFrequency: true,
  },
  options: {
    omcs: ["HPCL", "IOCL", "RIL", "Others"],
    callStatuses: [
      "Interested", "Follow Up", "Not Interested", "Call Back",
      "Call Disconnected", "Call Drop", "Not Connected", "Language Barrier"
    ],
    interestedStatuses: [
      "Will Recharge Later", "Card Not Activated", "Plan Sales - Waiting for Plan Activation",
      "On Call Recharge Done", "Requesting for Field Executive to meet F2F",
      "Plan Sales - HPCL - Waiting for Hotlist", "Will buy Fuel when finds a load",
      "GPS Service Issue", "Transporter Fills Fuel, Will buy Fuel when gets Outside Load",
      "FT Service Issue", "Plan Sales - IOCL - Waiting for Hotlist", "DND - Will do on his own",
    ],
    plans: ["Bonus", "Super Bonus", "Super Bonus Plus", "Monthly"],
    notInterestedReasons: [
      "Plan Sales - Not Interested in Value Prop", "Transporter fills the Fuel",
      "Do not Disturb (DND)", "FT Service Issue", "GPS Service Issue", "No Truck / Truck Sold",
      "Education issue - Does not want/know online transactions",
      "Already using Other Fuel Cards/Better Offers", "Wrong Commitment from FOS",
      "Vehicle Runs in Local", "Less than 7.5 Ton / Filling Bio-Gas",
      "Customer Wants only Physical Card", "Load Issue", "Card Not Activated",
    ]
  },
  actionMapping: {
    "Interested": "interested",
    "Follow Up": "follow_up",
    "Call Back": "call_back",
    "Not Interested": "not_interested",
  }
};

// ─── Config Service ───────────────────────────────────────────────────────────

export const ConfigService = {
  // ── Form Config ─────────────────────────────────────────────────────────────

  getUserConfig: async (_email: string): Promise<FormConfig> => {
    try {
      const res = await fetch('/api/config', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        return data.config as FormConfig;
      }
    } catch (e) {
      console.error("Failed to load user config from MongoDB", e);
    }
    return DEFAULT_CONFIG;
  },

  saveUserConfig: async (_email: string, config: FormConfig): Promise<boolean> => {
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config })
      });
      return res.ok;
    } catch (e) {
      console.error("Failed to save user config to database", e);
    }
    return false;
  },

  // ── Dashboard Config ─────────────────────────────────────────────────────────

  getDashboardConfig: async (): Promise<DashboardConfig> => {
    try {
      const res = await fetch('/api/config?type=dashboard', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.dashboardConfig) return data.dashboardConfig as DashboardConfig;
      }
    } catch (e) {
      console.error("Failed to load dashboard config from MongoDB", e);
    }
    return DEFAULT_DASHBOARD_CONFIG;
  },

  saveDashboardConfig: async (config: DashboardConfig): Promise<boolean> => {
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'dashboard', dashboardConfig: config })
      });
      return res.ok;
    } catch (e) {
      console.error("Failed to save dashboard config to database", e);
    }
    return false;
  },
};
