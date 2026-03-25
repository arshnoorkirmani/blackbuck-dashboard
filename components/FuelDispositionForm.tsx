"use client";
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { dispositionSchema, DispositionFormData, DispositionService } from "@/lib/services/disposition.service";
import { AppHeader } from "@/components/shared/app-header";
import { StepBadge } from "@/components/shared/step-badge";
import { FormField } from "@/components/shared/form-field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CheckIcon, ChevronRightIcon, Loader2, CheckCircle2, CalendarIcon, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const OMCs = ["HPCL", "IOCL", "RIL", "Others"];

const CALL_STATUSES = [
  { label: "Interested", color: "#4ADE80", bg: "bg-emerald-100 dark:bg-emerald-900/40", border: "border-emerald-300 dark:border-emerald-500/30", text: "text-emerald-700 dark:text-emerald-400" },
  { label: "Follow Up", color: "#60A5FA", bg: "bg-blue-100 dark:bg-blue-900/40", border: "border-blue-300 dark:border-blue-500/30", text: "text-blue-700 dark:text-blue-400" },
  { label: "Not Interested", color: "#F87171", bg: "bg-red-100 dark:bg-red-900/40", border: "border-red-300 dark:border-red-500/30", text: "text-red-700 dark:text-red-400" },
  { label: "Call Back", color: "#C084FC", bg: "bg-purple-100 dark:bg-purple-900/40", border: "border-purple-300 dark:border-purple-500/30", text: "text-purple-700 dark:text-purple-400" },
  { label: "Call Disconnected", color: "#71717A", bg: "bg-zinc-100 dark:bg-zinc-800/60", border: "border-zinc-300 dark:border-zinc-500/30", text: "text-zinc-700 dark:text-zinc-400" },
  { label: "Call Drop", color: "#71717A", bg: "bg-zinc-100 dark:bg-zinc-800/60", border: "border-zinc-300 dark:border-zinc-500/30", text: "text-zinc-700 dark:text-zinc-400" },
  { label: "Not Connected", color: "#71717A", bg: "bg-zinc-100 dark:bg-zinc-800/60", border: "border-zinc-300 dark:border-zinc-500/30", text: "text-zinc-700 dark:text-zinc-400" },
  { label: "Language Barrier", color: "#FCD34D", bg: "bg-amber-100 dark:bg-amber-900/40", border: "border-amber-300 dark:border-amber-500/30", text: "text-amber-700 dark:text-amber-400" },
];

const INTERESTED_STATUSES = [
  "Will Recharge Later", "Card Not Activated", "Plan Sales - Waiting for Plan Activation",
  "On Call Recharge Done", "Requesting for Field Executive to meet F2F",
  "Plan Sales - HPCL - Waiting for Hotlist", "Will buy Fuel when finds a load",
  "GPS Service Issue", "Transporter Fills Fuel, Will buy Fuel when gets Outside Load",
  "FT Service Issue", "Plan Sales - IOCL - Waiting for Hotlist", "DND - Will do on his own",
];
const PLANS = ["Bonus", "Super Bonus", "Super Bonus Plus", "Monthly"];
const NOT_INTERESTED_REASONS = [
  "Plan Sales - Not Interested in Value Prop", "Transporter fills the Fuel",
  "Do not Disturb (DND)", "FT Service Issue", "GPS Service Issue", "No Truck / Truck Sold",
  "Education issue - Does not want/know online transactions",
  "Already using Other Fuel Cards/Better Offers", "Wrong Commitment from FOS",
  "Vehicle Runs in Local", "Less than 7.5 Ton / Filling Bio-Gas",
  "Customer Wants only Physical Card", "Load Issue", "Card Not Activated",
];

const TIPS: Record<string, string> = {
  "Interested": "Ensure the plan pitched aligns with the customer's usage patterns and OMC preference.",
  "Follow Up": "Set follow-up date within 3 working days for best conversion rates.",
  "Not Interested": "Accurate rejection reasons improve targeting for future outreach campaigns.",
  "Call Back": "Respect the customer's preferred callback window to improve answer rates.",
  "Call Disconnected": "Capture exact verbiage in remarks to help QA analysis.",
  "Call Drop": "Capture exact verbiage in remarks to help QA analysis.",
  "Not Connected": "Capture exact verbiage in remarks to help QA analysis.",
  "Language Barrier": "Note the language spoken to route future calls to appropriate agents.",
};

const SIMPLE_STATUSES = ["Call Disconnected", "Call Drop", "Not Connected", "Language Barrier"];

function DatePicker({ value, onChange, label, error }: { value: string; onChange: (v: string) => void; label: string; error?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal bg-card shadow-sm h-[42px] px-3.5 py-2 transition-all",
              !value && "text-muted-foreground",
              error ? "border-destructive ring-1 ring-destructive" : "border-input"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
            {value ? format(new Date(value), "PPP") : <span className="text-sm">Select {label}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 z-50 pointer-events-auto" align="start">
          <Calendar
            mode="single"
            selected={value ? new Date(value) : undefined}
            onSelect={(d) => {
              onChange(d ? d.toISOString() : "");
              setOpen(false);
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      {error && <p className="text-[10.5px] font-medium text-destructive mt-1.5 flex items-center gap-1"><AlertCircle className="size-3" /> {error}</p>}
    </>
  );
}

export default function FuelDispositionForm() {
  const form = useForm<DispositionFormData>({
    resolver: zodResolver(dispositionSchema),
    defaultValues: {
      foNumber: "", omc: "", noOfTrucks: "", fuelingPotential: "", fuelingFrequency: "",
      callStatus: "", remarks: "",
      intSt: "", nxtDate: "", plan: "", fuDate: "", fuPlan: "", niReason: "", cbDate: ""
    }
  });

  const { watch, setValue, handleSubmit, formState: { errors } } = form;
  const foNumber = watch("foNumber");
  const omc = watch("omc");
  const callStatus = watch("callStatus");
  const remarks = watch("remarks");

  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(false);

  // Load drafted data from Service on component mount
  useEffect(() => {
    const draft = DispositionService.getDraft();
    if (draft) {
      form.reset(draft as DispositionFormData);
    }
  }, [form]);

  // Subscribe to form state strictly for background caching
  useEffect(() => {
    const subscription = watch((value) => {
      DispositionService.saveDraft(value as Partial<DispositionFormData>);
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  const setStatus = (val: string) => {
    if (val === callStatus) return;
    setValue("intSt", ""); setValue("nxtDate", ""); setValue("plan", "");
    setValue("fuDate", ""); setValue("fuPlan", ""); setValue("niReason", ""); setValue("cbDate", "");
    setValue("callStatus", val, { shouldValidate: true });
  };

  const onSubmit = async (data: DispositionFormData) => {
    setSubmitting(true);
    try {
      const response = await DispositionService.submitRecord(data);
      if (response.success) {
        setToast(true);
        setTimeout(() => setToast(false), 3500);
        form.reset({
          foNumber: "", omc: "", noOfTrucks: "", fuelingPotential: "", fuelingFrequency: "",
          callStatus: "", remarks: "",
          intSt: "", nxtDate: "", plan: "", fuDate: "", fuPlan: "", niReason: "", cbDate: ""
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedSt = CALL_STATUSES.find(s => s.label === callStatus);
  const isSimple = SIMPLE_STATUSES.includes(callStatus);
  const coreFields = [foNumber, omc, callStatus, remarks].filter(Boolean).length;
  const progress = Math.round((coreFields / 4) * 100);

  return (
    <div className="flex flex-col flex-1 w-full relative min-h-screen bg-background text-foreground font-sans">
      <AppHeader />

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-2 lg:grid-rows-[1fr_auto] flex-1 overflow-hidden h-[calc(100vh-58px)] w-full relative">

        {/* LEFT: form content */}
        <div className="col-start-1 row-start-1 overflow-y-auto px-6 py-6 md:pl-10 md:pr-12 md:py-6 border-r border-border">
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground tracking-normal mb-1">
            Fuel Dispositions
          </h1>
          <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-4">
            Log call outcomes — FY2026 Q2
          </p>

          {/* Progress */}
          <div className="h-1 w-full bg-secondary rounded-full mb-5 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500 ease-out",
                progress === 100 ? "bg-emerald-500" : "bg-primary"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* ─ Section 1 ─ */}
          <div className="mb-5">
            <StepBadge num="01" title="Core Interaction Details" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <FormField label="FO Number" required>
                <Input
                  autoFocus
                  placeholder="e.g. FO-102938"
                  {...form.register("foNumber")}
                  className={errors.foNumber ? "border-destructive ring-destructive" : ""}
                />
                {errors.foNumber && <p className="text-[10.5px] font-medium text-destructive mt-1.5 flex items-center gap-1"><AlertCircle className="size-3" /> {errors.foNumber.message}</p>}
              </FormField>

              <FormField label="Target OMC" required>
                <div className="grid grid-cols-4 gap-1.5">
                  {OMCs.map(o => (
                    <label key={o} className="cursor-pointer">
                      <input
                        type="radio"
                        value={o}
                        checked={omc === o}
                        onChange={() => setValue("omc", o, { shouldValidate: true })}
                        className="peer sr-only"
                      />
                      <div className={cn(
                        "rounded-md py-2 font-mono text-[10px] sm:text-[11px] text-center font-medium transition-all duration-200 border peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-background",
                        omc === o
                          ? "bg-primary/10 border-primary shadow-[0_0_10px_rgba(16,185,129,0.15)] ring-1 ring-primary text-primary"
                          : "bg-background border-border shadow-sm text-muted-foreground hover:border-primary/40 hover:bg-muted/40 hover:text-foreground"
                      )}>
                        {o}
                      </div>
                    </label>
                  ))}
                </div>
                {errors.omc && <p className="text-[10.5px] font-medium text-destructive mt-1.5 flex items-center gap-1"><AlertCircle className="size-3" /> {errors.omc.message}</p>}
              </FormField>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              <FormField label="No of Trucks" className="col-span-1">
                <Input placeholder="Your answer" {...form.register("noOfTrucks")} />
              </FormField>
              <FormField label="Fueling Potential" className="col-span-1">
                <Input placeholder="Your answer" {...form.register("fuelingPotential")} />
              </FormField>
              <FormField label="Fueling Frequency" className="col-span-1">
                <Input placeholder="Your answer" {...form.register("fuelingFrequency")} />
              </FormField>
            </div>

            <FormField label="Primary Call Outcome" required>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CALL_STATUSES.map(s => {
                  const active = callStatus === s.label;
                  return (
                    <label key={s.label} className="cursor-pointer">
                      <input
                        type="radio"
                        name="callStatus"
                        value={s.label}
                        checked={active}
                        onChange={() => setStatus(s.label)}
                        className="peer sr-only"
                      />
                      <div className={cn(
                        "flex items-center gap-2.5 rounded-lg border p-2.5 text-left text-[13px] transition-all duration-200 shadow-sm peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-background",
                        active
                          ? cn(s.bg, s.border, "font-semibold ring-1", s.text.replace("text-", "ring-").split(" ")[0])
                          : "bg-background border-border text-muted-foreground font-medium hover:border-primary/40 hover:bg-muted/30 hover:text-foreground hover:shadow-md",
                        errors.callStatus && !active ? "border-destructive/50" : ""
                      )}>
                        <span
                          className="size-1.5 rounded-full shrink-0 transition-all duration-300"
                          style={{
                            backgroundColor: active ? s.color : "#3F3F46",
                            boxShadow: active ? `0 0 8px ${s.color}60` : "none"
                          }}
                        />
                        <span className={active ? s.text : ""}>{s.label}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
              {errors.callStatus && <p className="text-[10.5px] font-medium text-destructive mt-1.5 flex items-center gap-1"><AlertCircle className="size-3" /> {errors.callStatus.message}</p>}
            </FormField>
          </div>

          <div className="my-5 border-t border-border" />

          {/* ─ Section 2/3: Remarks ─ */}
          <div className="mb-5">
            <StepBadge num={callStatus ? "03" : "02"} title="Observation & Remarks" />
            <FormField label="Agent Context Note" required>
              <Textarea
                placeholder="Enter verbatim response, context, or any other necessary details..."
                rows={2}
                {...form.register("remarks")}
                className={errors.remarks ? "border-destructive ring-destructive" : ""}
              />
              {errors.remarks && <p className="text-[10.5px] font-medium text-destructive mt-1.5 flex items-center gap-1"><AlertCircle className="size-3" /> {errors.remarks.message}</p>}
            </FormField>
          </div>
        </div>

        {/* ── RIGHT: dynamic context ── */}
        <div className="lg:col-start-2 lg:row-start-1 lg:row-span-2 bg-muted/20 dark:bg-zinc-950/40 overflow-y-auto px-6 py-6 md:pl-14 md:pr-12 md:py-12 relative z-0">
          {!callStatus ? (
            <div className="flex flex-col items-center justify-center h-full text-center animate-in fade-in duration-500">
              <div className="flex size-14 items-center justify-center rounded-xl bg-card border border-border mb-3">
                <CheckCircle2 strokeWidth={1.5} className="text-muted-foreground size-6" />
              </div>
              <p className="font-heading text-[15px] font-bold text-foreground mb-1">
                Action Context
              </p>
              <p className="text-[12px] text-muted-foreground max-w-[200px] leading-relaxed">
                Select a call outcome to see required follow-up fields
              </p>
            </div>
          ) : (
            <div key={callStatus} className="animate-in fade-in slide-in-from-bottom-2 duration-300">

              <div className="flex items-center gap-3 mb-5">
                <div className="flex size-7 items-center justify-center rounded-md border border-primary/20 bg-primary/10 font-mono text-[11px] font-medium text-primary">
                  02
                </div>
                <span className="font-heading text-[15px] font-bold text-foreground tracking-tight">
                  {callStatus}
                </span>
                {selectedSt && (
                  <span
                    className={cn(
                      "ml-auto px-2.5 py-1 rounded-full border font-mono text-[10px] font-medium tracking-wide",
                      selectedSt.bg, selectedSt.border, selectedSt.text
                    )}
                  >
                    ● active
                  </span>
                )}
              </div>

              {/* Interested */}
              {callStatus === "Interested" && (
                <div className="space-y-4">
                  <FormField label="Interested Phase / State" required>
                    <Select value={watch("intSt")} onValueChange={v => setValue("intSt", v, { shouldValidate: true })}>
                      <SelectTrigger className={errors.intSt ? "border-destructive ring-destructive" : ""}><SelectValue placeholder="Select exact status" /></SelectTrigger>
                      <SelectContent>
                        {INTERESTED_STATUSES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {errors.intSt && <p className="text-[10.5px] font-medium text-destructive mt-1.5 flex items-center gap-1"><AlertCircle className="size-3" /> {errors.intSt.message}</p>}
                  </FormField>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Expected Next Transaction" required>
                      <DatePicker value={watch("nxtDate") || ""} onChange={v => setValue("nxtDate", v, { shouldValidate: true })} label="date" error={errors.nxtDate?.message} />
                    </FormField>
                    <FormField label="Pitched Plan" required>
                      <Select value={watch("plan")} onValueChange={v => setValue("plan", v, { shouldValidate: true })}>
                        <SelectTrigger className={errors.plan ? "border-destructive ring-destructive" : ""}><SelectValue placeholder="Select Plan" /></SelectTrigger>
                        <SelectContent>
                          {PLANS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {errors.plan && <p className="text-[10.5px] font-medium text-destructive mt-1.5 flex items-center gap-1"><AlertCircle className="size-3" /> {errors.plan.message}</p>}
                    </FormField>
                  </div>
                </div>
              )}

              {/* Follow Up */}
              {callStatus === "Follow Up" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Scheduled Follow Up" required>
                    <DatePicker value={watch("fuDate") || ""} onChange={v => setValue("fuDate", v, { shouldValidate: true })} label="date" error={errors.fuDate?.message} />
                  </FormField>
                  <FormField label="Discussed Plan" required>
                    <Select value={watch("fuPlan")} onValueChange={v => setValue("fuPlan", v, { shouldValidate: true })}>
                      <SelectTrigger className={errors.fuPlan ? "border-destructive ring-destructive" : ""}><SelectValue placeholder="Select Plan" /></SelectTrigger>
                      <SelectContent>
                        {PLANS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {errors.fuPlan && <p className="text-[10.5px] font-medium text-destructive mt-1.5 flex items-center gap-1"><AlertCircle className="size-3" /> {errors.fuPlan.message}</p>}
                  </FormField>
                </div>
              )}

              {/* Not Interested */}
              {callStatus === "Not Interested" && (
                <FormField label="Reason for Rejection" required>
                  <Select value={watch("niReason")} onValueChange={v => setValue("niReason", v, { shouldValidate: true })}>
                    <SelectTrigger className={errors.niReason ? "border-destructive ring-destructive" : ""}><SelectValue placeholder="Identify the core reason" /></SelectTrigger>
                    <SelectContent>
                      {NOT_INTERESTED_REASONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.niReason && <p className="text-[10.5px] font-medium text-destructive mt-1.5 flex items-center gap-1"><AlertCircle className="size-3" /> {errors.niReason.message}</p>}
                </FormField>
              )}

              {/* Call Back */}
              {callStatus === "Call Back" && (
                <FormField label="Customer Requested Time" required>
                  <DatePicker value={watch("cbDate") || ""} onChange={v => setValue("cbDate", v, { shouldValidate: true })} label="time" error={errors.cbDate?.message} />
                </FormField>
              )}

              {/* Simple statuses */}
              {isSimple && (
                <div className="flex gap-4 items-start bg-card border border-border rounded-xl p-5">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-muted border border-border shrink-0">
                    <CheckCircle2 className="size-4 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-foreground mb-1">Status Logged</div>
                    <div className="text-[12px] text-muted-foreground leading-relaxed">
                      No additional fields required. Add relevant context in remarks.
                    </div>
                  </div>
                </div>
              )}

              {/* Tip card */}
              <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 shadow-sm">
                <div className="font-mono text-[9px] text-amber-600 dark:text-amber-500 tracking-widest uppercase mb-1 font-bold flex items-center gap-1.5">
                  <div className="size-1.5 rounded-full bg-amber-500 animate-pulse" /> Field tip
                </div>
                <div className="text-[12px] font-medium text-amber-900/80 dark:text-amber-200/80 leading-relaxed">
                  {TIPS[callStatus]}
                </div>
              </div>

              {/* Completion checklist */}
              <div className="mt-4">
                <div className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase mb-2.5 font-bold border-b border-border/50 pb-1.5">
                  Submission checklist
                </div>
                <div className="space-y-2">
                  {[
                    { label: "FO Number entered", done: !!foNumber },
                    { label: "OMC selected", done: !!omc },
                    { label: "Call status chosen", done: !!callStatus },
                    { label: "Remarks filled", done: !!remarks },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-3.5">
                      <div
                        className={cn(
                          "flex size-5 items-center justify-center rounded-md border shrink-0 transition-all duration-300",
                          item.done
                            ? "bg-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.2)] border-emerald-500/50 text-emerald-600 dark:text-emerald-400"
                            : "border-border bg-background shadow-sm"
                        )}
                      >
                        {item.done && <CheckIcon className="size-3.5" strokeWidth={3.5} />}
                      </div>
                      <span
                        className={cn(
                          "text-[13px] font-medium transition-colors",
                          item.done ? "text-muted-foreground" : "text-foreground/90"
                        )}
                      >
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>

        {/* ── BOTTOM LEFT: Submit Panel ── */}
        <div className="col-start-1 lg:row-start-2 border-r border-border border-t bg-background/80 backdrop-blur-md px-6 py-5 md:pl-10 md:pr-12 flex flex-row items-center justify-between gap-4 z-10 w-full shrink-0">
          <div className="flex items-center gap-3">
            <Button
              type="submit"
              disabled={submitting}
              size="lg"
              className={cn(
                "font-heading font-bold text-[14px] tracking-tight gap-2 shadow-sm transition-all",
                submitting ? "bg-primary/80" : "hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]"
              )}
            >
              {submitting ? (
                <><Loader2 className="animate-spin size-4" /> Syncing...</>
              ) : (
                <>Sync Record <ChevronRightIcon className="size-4" strokeWidth={3} /></>
              )}
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="ghost" size="sm" className="font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                  Clear Form
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear form data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete your current offline draft and reset all fields. You cannot undo this action.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      DispositionService.clearDraft();
                      form.reset({
                        foNumber: "", omc: "", noOfTrucks: "", fuelingPotential: "", fuelingFrequency: "",
                        callStatus: "", remarks: "",
                        intSt: "", nxtDate: "", plan: "", fuDate: "", fuPlan: "", niReason: "", cbDate: ""
                      });
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm"
                  >
                    Clear everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest hidden lg:inline-block">
            verify all fields before syncing
          </span>
        </div>
      </form>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[9999] flex items-start gap-3 rounded-xl bg-card border border-emerald-500/30 p-4 shadow-lg animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
            <CheckIcon className="size-3" strokeWidth={3} />
          </div>
          <div>
            <div className="mb-0.5 text-[13px] font-semibold text-foreground">Record synced</div>
            <div className="text-[12px] text-muted-foreground">Disposition saved successfully.</div>
          </div>
        </div>
      )}
    </div>
  );
}