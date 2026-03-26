import mongoose, { Schema } from 'mongoose';

const UserConfigSchema = new Schema({
  email: { type: String, required: true, unique: true },
  config: { type: Object, required: true }
}, { timestamps: true });

export default mongoose.models.UserConfig || mongoose.model('UserConfig', UserConfigSchema);
