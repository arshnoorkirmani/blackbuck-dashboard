import { z } from "zod";

export const dispositionSchema = z.object({
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
}).superRefine((data, ctx) => {
  if (data.callStatus === "Interested") {
    if (!data.intSt) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Phase is required", path: ["intSt"] });
    if (!data.nxtDate) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Date is required", path: ["nxtDate"] });
    if (!data.plan) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Plan is required", path: ["plan"] });
  }
  if (data.callStatus === "Follow Up") {
    if (!data.fuDate) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Date is required", path: ["fuDate"] });
    if (!data.fuPlan) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Plan is required", path: ["fuPlan"] });
  }
  if (data.callStatus === "Not Interested" && !data.niReason) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Reason is required", path: ["niReason"] });
  }
  if (data.callStatus === "Call Back" && !data.cbDate) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Time is required", path: ["cbDate"] });
  }
});

export type DispositionFormData = z.infer<typeof dispositionSchema>;

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
   * Submits the record. 
   * In the future, replace the internal logic with a fetch() call to connect to a real DB.
   * For now, it mocks an API delay and stores the final record in localStorage.
   */
  static async submitRecord(data: DispositionFormData): Promise<{ success: boolean; id: string }> {
    // Format any blank fields as purely blank spaces (" ") before saving
    const processedData = Object.fromEntries(
      Object.entries(data).map(([key, val]) => [key, val === "" || val === undefined ? " " : val])
    ) as DispositionFormData;

    // Simulate network delay for DB connection
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // Save to our "Mock DB" in localStorage
    if (typeof window !== "undefined") {
      const existing = localStorage.getItem(DB_KEY);
      const records = existing ? JSON.parse(existing) : [];
      const newRecord = {
        id: `fd_${Date.now()}`,
        createdAt: new Date().toISOString(),
        ...processedData
      };
      records.push(newRecord);
      localStorage.setItem(DB_KEY, JSON.stringify(records));
      console.log("Mock DB saved record:", newRecord);
    }

    // Clear draft form data after successful sync
    this.clearDraft();

    return { success: true, id: `fd_${Date.now()}` };
  }
}
