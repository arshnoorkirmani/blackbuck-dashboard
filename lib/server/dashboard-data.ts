import type { Session } from "next-auth";
import dbConnect from "@/lib/mongodb";
import UserConfig from "@/lib/models/UserConfig";
import DashboardCache from "@/lib/models/DashboardCache";
import { DEFAULT_DASHBOARD_CONFIG, type DashboardConfig } from "@/lib/types/dashboard";
import { getSheetData } from "@/lib/google";

type RawRow = (string | number | null | undefined)[];

export type DashboardRawDataPayload = {
  agentRaw: RawRow[];
  tlRaw: RawRow[];
  rawSalesRaw: RawRow[];
  teleSalesRaw: RawRow[];
  incentiveRaw: RawRow[];
  appraisalRaw: RawRow[];
  incentiveStructureRaw: RawRow[];
  employeeInfoRaw: RawRow[];
};

async function loadDashboardConfig() {
  await dbConnect();
  const configRecord = await UserConfig.findOne({ email: "__dashboard__" });
  const config: DashboardConfig = configRecord?.config ?? DEFAULT_DASHBOARD_CONFIG;
  return config;
}

async function readCachedRawData() {
  await dbConnect();
  const cacheRecord = await DashboardCache.findOne({ key: "__latest__" }).lean();
  return (cacheRecord?.payload ?? null) as DashboardRawDataPayload | null;
}

async function writeCachedRawData(payload: DashboardRawDataPayload) {
  await dbConnect();
  await DashboardCache.findOneAndUpdate(
    { key: "__latest__" },
    { key: "__latest__", payload, fetchedAt: new Date().toISOString() },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

export async function loadDashboardRawData(session: Session & { authProvider?: string }) {
  const config = await loadDashboardConfig();
  if (!config.sheetUrl) {
    throw new Error("Dashboard not configured.");
  }

  const sheetMatch = config.sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
  const sheetId = sheetMatch?.[1];
  if (!sheetId) {
    throw new Error("Invalid Sheet URL.");
  }

  const isCredentialSession = session.authProvider === "credentials";
  if (isCredentialSession) {
    const cached = await readCachedRawData();
    if (!cached) {
      throw new Error("No cached dashboard data available yet. Open the dashboard once with a Google-authenticated account.");
    }
    return cached;
  }

  if (!session.accessToken) {
    throw new Error("Unauthorized");
  }

  const payload = {
    agentRaw: await getSheetData(session.accessToken, sheetId, config.tabs.agent),
    tlRaw: await getSheetData(session.accessToken, sheetId, config.tabs.tl),
    rawSalesRaw: await getSheetData(session.accessToken, sheetId, config.tabs.rawSales),
    teleSalesRaw: await getSheetData(session.accessToken, sheetId, config.tabs.teleSales),
    incentiveRaw: await getSheetData(session.accessToken, sheetId, config.tabs.incentive),
    appraisalRaw: await getSheetData(session.accessToken, sheetId, config.tabs.appraisal),
    incentiveStructureRaw: await getSheetData(session.accessToken, sheetId, config.tabs.incentiveStructure),
    employeeInfoRaw: await getSheetData(session.accessToken, sheetId, config.tabs.employeeInfo),
  };

  await writeCachedRawData(payload);
  return payload;
}
