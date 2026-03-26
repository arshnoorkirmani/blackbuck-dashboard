import mongoose, { Schema } from 'mongoose';

const DispositionSchema = new Schema({
  agentEmail: { type: String, required: true, index: true },
  foNumber: { type: String, required: true },
  omc: { type: String, required: true },
  callStatus: { type: String, required: true },
  remarks: { type: String, required: true },
  
  // Optional / Dynamic formulation fields
  noOfTrucks: { type: String },
  fuelingPotential: { type: String },
  fuelingFrequency: { type: String },
  intSt: { type: String },
  nxtDate: { type: String },
  plan: { type: String },
  fuDate: { type: String },
  fuPlan: { type: String },
  niReason: { type: String },
  cbDate: { type: String },
}, { timestamps: true });

export default mongoose.models.Disposition || mongoose.model('Disposition', DispositionSchema);
