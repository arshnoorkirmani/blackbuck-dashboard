import mongoose, { Schema } from "mongoose";

const DashboardCacheSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    payload: { type: Object, required: true },
    fetchedAt: { type: String, required: true },
  },
  { timestamps: true }
);

const DashboardCache = mongoose.models.DashboardCache || mongoose.model("DashboardCache", DashboardCacheSchema);

export default DashboardCache;
