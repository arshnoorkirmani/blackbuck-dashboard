import { z } from "zod";
import { FormConfig, DEFAULT_CONFIG } from "./config.service";

export const baseDispositionSchema = z.object({
  foNumber: z.string().min(1, "FO Number is required"),
  omc: z.string().min(1, "Target OMC is required"),
  noOfTrucks: z.string().optional(),
  fuelingPotential: z.string().optional(),
  fuelingFrequency: z.string().optional(),
  callStatus: z.string().min(1, "Primary Call Outcome is required"),
  remarks: z.string().min(1, "Agent Context Note is required"),
  intSt: z.string().optional(),
  nxtDate: z.string().optional(),
  plan: z.string().optional(),
  fuDate: z.string().optional(),
  fuPlan: z.string().optional(),
  niReason: z.string().optional(),
  cbDate: z.string().optional(),
});

export type DispositionFormData = z.infer<typeof baseDispositionSchema>;

export const generateDispositionSchema = (config: FormConfig) => {
  return baseDispositionSchema.superRefine((data, ctx) => {
    // Dynamic Validation based on Settings
    if (data.omc && !config.options.omcs.includes(data.omc)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid OMC selected", path: ["omc"] });
    }
    if (data.callStatus && !config.options.callStatuses.includes(data.callStatus)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid Status selected", path: ["callStatus"] });
    }

    const actionSection = config.actionMapping?.[data.callStatus] || DEFAULT_CONFIG.actionMapping?.[data.callStatus] || "none";

    if (actionSection === "interested") {
      if (!data.intSt) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Phase is required", path: ["intSt"] });
      if (!data.nxtDate) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Date is required", path: ["nxtDate"] });
      if (!data.plan) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Plan is required", path: ["plan"] });
    }
    if (actionSection === "follow_up") {
      if (!data.fuDate) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Date is required", path: ["fuDate"] });
      if (!data.fuPlan) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Plan is required", path: ["fuPlan"] });
    }
    if (actionSection === "not_interested" && !data.niReason) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Reason is required", path: ["niReason"] });
    }
    if (actionSection === "call_back" && !data.cbDate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Time is required", path: ["cbDate"] });
    }
  });
};

const DRAFT_KEY = "fuel_disposition_draft";
const DB_KEY = "fuel_disposition_db";

export class DispositionService {
  /**
   * Auto-save the form draft to localStorage so the user does not lose progress
   */
  static saveDraft(data: Partial<DispositionFormData>) {
    if (typeof window === "undefined") return;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  }

  /**
   * Retrieve the saved draft on component mount
   */
  static getDraft(): Partial<DispositionFormData> | null {
    if (typeof window === "undefined") return null;
    const item = localStorage.getItem(DRAFT_KEY);
    if (!item) return null;
    try {
      return JSON.parse(item);
    } catch {
      return null;
    }
  }

  /**
   * Clear the draft after successful submission
   */
  static clearDraft() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(DRAFT_KEY);
  }

  /**
   * Submits the record to MongoDB backend APIs.
   * Caches form offline for incomplete sessions strictly separated. 
   */
  static async submitRecord(data: DispositionFormData): Promise<{ success: boolean; id?: string }> {
    // Format any blank fields as purely blank spaces (" ") before saving
    const processedData = Object.fromEntries(
      Object.entries(data).map(([key, val]) => [key, val === "" || val === undefined ? " " : val])
    ) as DispositionFormData;

    try {
      const res = await fetch('/api/disposition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(processedData)
      });
      
      if (!res.ok) {
        throw new Error("Failed to post disposition to the database.");
      }
      
      const json = await res.json();
      this.clearDraft(); // Clear local draft on valid success returns
      return { success: true, id: json.id };
    } catch (error) {
      console.error("MongoDB POST transaction failed", error);
      return { success: false };
    }
  }
}
