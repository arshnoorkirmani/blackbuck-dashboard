import mongoose, { Schema, type InferSchemaType } from "mongoose";

const UserAccessSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    name: { type: String, default: "" },
    role: { type: String, enum: ["SUPER_ADMIN", "ADMIN", "TL", "AGENT"], default: "AGENT" },
    authProvider: { type: String, enum: ["google", "credentials"], default: "google" },
    isActive: { type: Boolean, default: true },
    employeeId: { type: String, default: "" },
    tlName: { type: String, default: "" },
    notes: { type: String, default: "" },
    lastLoginAt: { type: Date, default: null },
    managedBy: { type: String, default: "" },
    permissions: {
      canSearchAgents: { type: Boolean, default: true },
      canExportData: { type: Boolean, default: false },
      canViewAdvancedAnalytics: { type: Boolean, default: true },
      canManageTeamMembers: { type: Boolean, default: false },
      canManageDashboardConfig: { type: Boolean, default: false },
      canManageUsers: { type: Boolean, default: false },
      canViewSensitivePayouts: { type: Boolean, default: false },
      canChangePermissions: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

export type UserAccessDocument = InferSchemaType<typeof UserAccessSchema>;

const UserAccess = mongoose.models.UserAccess || mongoose.model("UserAccess", UserAccessSchema);

export default UserAccess;
