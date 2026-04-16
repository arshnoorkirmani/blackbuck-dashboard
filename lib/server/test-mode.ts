import { promises as fs } from "node:fs";
import path from "node:path";
import type { DashboardRawDataPayload } from "@/lib/server/dashboard-data";

type TestModeState = {
  enabled: boolean;
  snapshotAt?: string;
  snapshotPath?: string;
};

const TEST_DIR = path.join(process.cwd(), "public", "trash");
const STATE_FILE = path.join(TEST_DIR, "test-mode.json");
const SNAPSHOT_FILE = path.join(TEST_DIR, "test-raw-snapshot.json");

async function ensureDir() {
  await fs.mkdir(TEST_DIR, { recursive: true });
}

export async function readTestModeState(): Promise<TestModeState> {
  try {
    const content = await fs.readFile(STATE_FILE, "utf-8");
    return JSON.parse(content) as TestModeState;
  } catch {
    return { enabled: false };
  }
}

export async function writeTestModeState(state: TestModeState) {
  await ensureDir();
  await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2), "utf-8");
}

export async function writeTestSnapshot(payload: DashboardRawDataPayload) {
  await ensureDir();
  const snapshot = {
    snapshotAt: new Date().toISOString(),
    data: payload,
  };
  await fs.writeFile(SNAPSHOT_FILE, JSON.stringify(snapshot, null, 2), "utf-8");
  return snapshot;
}

export async function readTestSnapshot(): Promise<DashboardRawDataPayload | null> {
  try {
    const content = await fs.readFile(SNAPSHOT_FILE, "utf-8");
    const parsed = JSON.parse(content) as { data?: DashboardRawDataPayload };
    return parsed?.data ?? null;
  } catch {
    return null;
  }
}
