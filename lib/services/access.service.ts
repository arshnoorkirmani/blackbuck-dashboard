import { env } from "@/lib/env";
import dbConnect from "@/lib/mongodb";
import UserAccess from "@/lib/models/UserAccess";
import {
  getDefaultPermissions,
  mergePermissions,
  normalizeRole,
  sanitizeEmail,
  type AccessProfile,
} from "@/lib/access-control";
import type { UserRole } from "@/lib/types/dashboard";

function buildSuperAdminProfile(): AccessProfile {
  return {
    email: sanitizeEmail(env.superAdminEmail),
    name: env.superAdminName,
    role: "SUPER_ADMIN",
    isActive: true,
    authProvider: "credentials",
    permissions: getDefaultPermissions("SUPER_ADMIN"),
    notes: "Bootstrap super admin account",
    lastLoginAt: null,
  };
}

function toAccessProfile(record: {
  email?: string;
  name?: string;
  role?: string;
  isActive?: boolean;
  authProvider?: "google" | "credentials";
  employeeId?: string;
  tlName?: string;
  notes?: string;
  permissions?: Record<string, boolean>;
  lastLoginAt?: Date | null;
} | null): AccessProfile | null {
  if (!record?.email) {
    return null;
  }

  const role = normalizeRole(record.role);
  return {
    email: sanitizeEmail(record.email),
    name: String(record.name ?? ""),
    role,
    isActive: record.isActive !== false,
    authProvider: record.authProvider === "credentials" ? "credentials" : "google",
    permissions: mergePermissions(role, record.permissions),
    employeeId: String(record.employeeId ?? ""),
    tlName: String(record.tlName ?? ""),
    notes: String(record.notes ?? ""),
    lastLoginAt: record.lastLoginAt ? record.lastLoginAt.toISOString() : null,
  };
}

export async function ensureSuperAdminAccess() {
  await dbConnect();
  const profile = buildSuperAdminProfile();

  await UserAccess.findOneAndUpdate(
    { email: profile.email },
    {
      email: profile.email,
      name: profile.name,
      role: profile.role,
      authProvider: profile.authProvider,
      isActive: true,
      permissions: profile.permissions,
      notes: profile.notes,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

export async function getAccessProfile(email: string) {
  const normalizedEmail = sanitizeEmail(email);
  if (!normalizedEmail) {
    return null;
  }

  await ensureSuperAdminAccess();
  const record = await UserAccess.findOne({ email: normalizedEmail }).lean();
  return toAccessProfile(record);
}

export async function upsertAccessProfile(input: {
  email: string;
  name?: string;
  role?: UserRole;
  authProvider?: "google" | "credentials";
  isActive?: boolean;
  employeeId?: string;
  tlName?: string;
  notes?: string;
  permissions?: Partial<AccessProfile["permissions"]>;
  managedBy?: string;
}) {
  const normalizedEmail = sanitizeEmail(input.email);
  if (!normalizedEmail) {
    return null;
  }

  await ensureSuperAdminAccess();
  const existing = await UserAccess.findOne({ email: normalizedEmail }).lean();
  const role = normalizeRole(input.role ?? existing?.role);
  const permissions = mergePermissions(role, { ...(existing?.permissions ?? {}), ...(input.permissions ?? {}) });

  const record = await UserAccess.findOneAndUpdate(
    { email: normalizedEmail },
    {
      email: normalizedEmail,
      name: String(input.name ?? existing?.name ?? ""),
      role,
      authProvider: input.authProvider ?? existing?.authProvider ?? "google",
      isActive: input.isActive ?? existing?.isActive ?? true,
      employeeId: String(input.employeeId ?? existing?.employeeId ?? ""),
      tlName: String(input.tlName ?? existing?.tlName ?? ""),
      notes: String(input.notes ?? existing?.notes ?? ""),
      permissions,
      managedBy: String(input.managedBy ?? existing?.managedBy ?? ""),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  return toAccessProfile(record);
}

export async function touchLastLogin(email: string) {
  const normalizedEmail = sanitizeEmail(email);
  if (!normalizedEmail) {
    return;
  }

  await ensureSuperAdminAccess();
  await UserAccess.findOneAndUpdate(
    { email: normalizedEmail },
    { lastLoginAt: new Date() },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

export async function listAccessProfiles() {
  await ensureSuperAdminAccess();
  const records = await UserAccess.find().sort({ role: 1, email: 1 }).lean();
  return records.map((record) => toAccessProfile(record)).filter(Boolean) as AccessProfile[];
}

export function getBaseRoleForEmail(email: string, storedRole?: UserRole | null): UserRole {
  const normalizedEmail = sanitizeEmail(email);
  if (!normalizedEmail) {
    return "AGENT";
  }

  if (storedRole && storedRole !== "AGENT") {
    return storedRole;
  }

  if (normalizedEmail === sanitizeEmail(env.superAdminEmail)) {
    return "SUPER_ADMIN";
  }

  if (env.adminEmails.includes(normalizedEmail)) {
    return "ADMIN";
  }

  return storedRole ?? "AGENT";
}
