import type { UserRole } from "@/lib/types/dashboard";

export type PermissionKey =
  | "canSearchAgents"
  | "canExportData"
  | "canViewAdvancedAnalytics"
  | "canManageTeamMembers"
  | "canManageDashboardConfig"
  | "canManageUsers"
  | "canViewSensitivePayouts"
  | "canChangePermissions";

export type PermissionMap = Record<PermissionKey, boolean>;

export type AccessProfile = {
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  authProvider: "google" | "credentials";
  permissions: PermissionMap;
  employeeId?: string;
  tlName?: string;
  notes?: string;
  lastLoginAt?: string | null;
};

const PERMISSION_KEYS: PermissionKey[] = [
  "canSearchAgents",
  "canExportData",
  "canViewAdvancedAnalytics",
  "canManageTeamMembers",
  "canManageDashboardConfig",
  "canManageUsers",
  "canViewSensitivePayouts",
  "canChangePermissions",
];

export function getDefaultPermissions(role: UserRole): PermissionMap {
  if (role === "SUPER_ADMIN") {
    return {
      canSearchAgents: true,
      canExportData: true,
      canViewAdvancedAnalytics: true,
      canManageTeamMembers: true,
      canManageDashboardConfig: true,
      canManageUsers: true,
      canViewSensitivePayouts: true,
      canChangePermissions: true,
    };
  }

  if (role === "ADMIN") {
    return {
      canSearchAgents: true,
      canExportData: true,
      canViewAdvancedAnalytics: true,
      canManageTeamMembers: true,
      canManageDashboardConfig: true,
      canManageUsers: false,
      canViewSensitivePayouts: true,
      canChangePermissions: false,
    };
  }

  if (role === "TL") {
    return {
      canSearchAgents: true,
      canExportData: true,
      canViewAdvancedAnalytics: true,
      canManageTeamMembers: true,
      canManageDashboardConfig: false,
      canManageUsers: false,
      canViewSensitivePayouts: true,
      canChangePermissions: false,
    };
  }

  return {
    canSearchAgents: true,
    canExportData: false,
    canViewAdvancedAnalytics: true,
    canManageTeamMembers: false,
    canManageDashboardConfig: false,
    canManageUsers: false,
    canViewSensitivePayouts: false,
    canChangePermissions: false,
  };
}

export function mergePermissions(role: UserRole, overrides?: Partial<PermissionMap> | null): PermissionMap {
  const defaults = getDefaultPermissions(role);

  if (!overrides) {
    return defaults;
  }

  const merged = { ...defaults };
  for (const key of PERMISSION_KEYS) {
    if (typeof overrides[key] === "boolean") {
      merged[key] = overrides[key] as boolean;
    }
  }
  return merged;
}

export function normalizeRole(value: unknown): UserRole {
  const role = String(value ?? "").toUpperCase();
  if (role === "SUPER_ADMIN" || role === "ADMIN" || role === "TL") {
    return role;
  }
  return "AGENT";
}

export function roleLabel(role: UserRole) {
  if (role === "SUPER_ADMIN") return "Super Admin";
  if (role === "ADMIN") return "Admin";
  if (role === "TL") return "Team Lead";
  return "Agent";
}

export function sanitizeEmail(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}
