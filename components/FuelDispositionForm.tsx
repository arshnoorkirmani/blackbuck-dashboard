"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { format } from "date-fns";
import {
  ChevronDown, CheckCircle2, Phone, ArrowRight, Activity, Truck, FileText,
  Calendar as CalendarIcon, Moon, Sun, Loader2
} from "lucide-react";

// Shadcn/UI Components (मान लें कि ये आपकी कंपोनेंट डायरेक्टरी में हैं)
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Constants
const OMCs = ["HPCL", "IOCL", "RIL", "Others"];
const CALL_STATUSES = ["Interested", "Follow Up", "Not Interested", "Call Back", "Call Disconnected", "Call Drop", "Not Connected", "Language Barrier"];
const INTERESTED_STATUSES = ["Will Recharge Later", "Card Not Activated", "Plan Sales - Waiting for Plan Activation", "On Call Recharge Done", "Requesting for Field Executive to meet F2F", "Plan Sales - HPCL - Waiting for Hotlist", "Will buy Fuel when finds a load", "GPS Service Issue", "Transporter Fills Fuel, Will buy Fuel when gets Outside Load", "FT Service Issue", "Plan Sales - IOCL - Waiting for Hotlist", "DND - Will do on his own"];
const PLANS = ["Bonus", "Super Bonus", "Super Bonus Plus", "Monthly"];
const NOT_INTERESTED_REASONS = ["Plan Sales - Not Interested in Value Prop", "Transporter fills the Fuel", "Do not Disturb (DND)", "FT Service Issue", "GPS Service Issue", "No Truck / Truck Sold", "Education issue - Does not want/know online transactions", "Already using Other Fuel Cards/Better Offers", "Wrong Commitment from FOS", "Vehicle Runs in Local", "Less than 7.5 Ton / Filling Bio-Gas", "Customer Wants only Physical Card", "Load Issue", "Card Not Activated"];


// Reusable InputField Component
const FormField = ({ id, label, children, required = false }: { id: string, label: string, children: React.ReactNode, required?: boolean }) => (
  <div className="grid w-full items-center gap-2">
    <Label htmlFor={id}>
      {label} {required && <span className="text-destructive">*</span>}
    </Label>
    {children}
  </div>
);

// Theme Toggle Component
const ThemeToggle = () => {
  const { setTheme, theme } = useTheme();
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};


// Main Application Component
export default function FuelDispositionForm() {
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);

  // Form state
  const [foNumber, setFoNumber] = useState("");
  const [omc, setOmc] = useState("");
  const [callStatus, setCallStatus] = useState("");
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic fields state
  const [interestedStatus, setInterestedStatus] = useState("");
  const [nextTransactionDate, setNextTransactionDate] = useState<Date>();
  const [planPitched, setPlanPitched] = useState("");
  const [followUpDate, setFollowUpDate] = useState<Date>();
  const [followUpPlan, setFollowUpPlan] = useState("");
  const [notInterestedReason, setNotInterestedReason] = useState("");
  const [callBackTime, setCallBackTime] = useState<Date>();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const resetDynamicFields = () => {
    setInterestedStatus("");
    setNextTransactionDate(undefined);
    setPlanPitched("");
    setFollowUpDate(undefined);
    setFollowUpPlan("");
    setNotInterestedReason("");
    setCallBackTime(undefined);
  };

  const handleCallStatusChange = (value: string) => {
    resetDynamicFields();
    setCallStatus(value);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "Success!",
        description: "Disposition has been synced successfully.",
        className: "bg-green-500 text-white",
      });
      // Here you would typically reset the form
    }, 1500);
  };

  if (!isMounted) return null; // Prevent hydration mismatch

  const renderDynamicContent = () => {
    if (!callStatus) {
      return (
        <div className="flex items-center justify-center text-center h-full">
          <p className="text-muted-foreground">Select a call outcome to see contextual actions.</p>
        </div>
      );
    }

    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">2</span>
            {callStatus} Action Context
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {callStatus === "Interested" && (
            <div className="space-y-6 animate-in fade-in-50">
              <FormField label="Interested Phase / State" id="interestedStatus" required>
                <Select value={interestedStatus} onValueChange={setInterestedStatus} required>
                  <SelectTrigger><SelectValue placeholder="Select exact status" /></SelectTrigger>
                  <SelectContent>
                    {INTERESTED_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Expected Next Transaction" id="nextTransaction" required>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {nextTransactionDate ? format(nextTransactionDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={nextTransactionDate} onSelect={setNextTransactionDate} initialFocus /></PopoverContent>
                </Popover>
              </FormField>
              <FormField label="Pitched Plan" id="planPitched" required>
                <Select value={planPitched} onValueChange={setPlanPitched} required>
                  <SelectTrigger><SelectValue placeholder="Select Plan" /></SelectTrigger>
                  <SelectContent>
                    {PLANS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
            </div>
          )}

          {callStatus === "Follow Up" && (
            <div className="space-y-6 animate-in fade-in-50">
              <FormField label="Scheduled Follow Up Time" id="followUp" required>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {followUpDate ? format(followUpDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={followUpDate} onSelect={setFollowUpDate} initialFocus /></PopoverContent>
                </Popover>
              </FormField>
              <FormField label="Discussed Plan" id="followUpPlan" required>
                <Select value={followUpPlan} onValueChange={setFollowUpPlan} required>
                  <SelectTrigger><SelectValue placeholder="Select Plan" /></SelectTrigger>
                  <SelectContent>
                    {PLANS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
            </div>
          )}

          {callStatus === "Not Interested" && (
            <div className="animate-in fade-in-50">
              <FormField label="Recorded Reason for Rejection" id="notInterestedReason" required>
                <Select value={notInterestedReason} onValueChange={setNotInterestedReason} required>
                  <SelectTrigger><SelectValue placeholder="Identify the core reason" /></SelectTrigger>
                  <SelectContent>
                    {NOT_INTERESTED_REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
            </div>
          )}

          {callStatus === "Call Back" && (
            <div className="animate-in fade-in-50">
              <FormField label="Customer Requested Time" id="callBack" required>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {callBackTime ? format(callBackTime, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={callBackTime} onSelect={setCallBackTime} initialFocus /></PopoverContent>
                </Popover>
              </FormField>
            </div>
          )}

          {["Call Disconnected", "Call Drop", "Not Connected", "Language Barrier"].includes(callStatus) && (
            <Alert className="animate-in fade-in-50">
              <Phone className="h-4 w-4" />
              <AlertTitle>Status Noted</AlertTitle>
              <AlertDescription>
                This status requires no extra data. Add context in the remarks.
              </AlertDescription>
            </Alert>
          )}

        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex-shrink-0 h-16 bg-card border-b flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
            <Truck className="w-5 h-5" />
          </div>
          <span className="text-lg font-bold text-card-foreground tracking-tight flex items-center gap-2">
            BlackBuck <span className="text-muted-foreground/50">|</span> <span className="text-muted-foreground font-medium">Operations</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20">
            AN
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <form onSubmit={handleSubmit} className="h-full grid lg:grid-cols-2">

          {/* Left Column (Scrollable) */}
          <div className="lg:border-r overflow-y-auto p-8 space-y-12">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">Fuel Dispositions 2026</h1>
              <p className="text-muted-foreground">Log field executive call dispositions quickly and efficiently.</p>
            </div>

            {/* Core Details Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">1</span>
                <h3 className="text-xl font-bold">Core Interaction Details</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <FormField label="FO Number" id="foNumber" required>
                  <Input id="foNumber" value={foNumber} onChange={(e) => setFoNumber(e.target.value)} placeholder="e.g. FO-102938" required />
                </FormField>
                <FormField label="Target OMC" id="omc" required>
                  <Select value={omc} onValueChange={setOmc} required>
                    <SelectTrigger><SelectValue placeholder="Select OMC" /></SelectTrigger>
                    <SelectContent>
                      {OMCs.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
              <FormField label="Primary Call Outcome" id="callStatus" required>
                <Select value={callStatus} onValueChange={handleCallStatusChange} required>
                  <SelectTrigger><SelectValue placeholder="What was the primary status of the call?" /></SelectTrigger>
                  <SelectContent>
                    {CALL_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            {/* Remarks Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {callStatus ? "3" : "2"}
                </span>
                <h3 className="text-xl font-bold">Observation & Remarks</h3>
              </div>
              <FormField label="Agent Context Note" id="remarks" required>
                <Textarea id="remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Enter verbatim response, context, or any other necessary details..." required rows={5} />
              </FormField>
            </div>

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-6 border-t">
              <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={isSubmitting}>
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Syncing...</>
                ) : (
                  <>Sync Record <ArrowRight className="w-4 h-4 ml-2" /></>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">Please double-check all details before syncing.</p>
            </div>
          </div>

          {/* Right Column (Static) */}
          <div className="hidden lg:block bg-muted/30 p-8">
            {renderDynamicContent()}
          </div>

          {/* Right Column (Drawer for Mobile) */}
          {callStatus && (
            <div className="lg:hidden fixed inset-x-0 bottom-0 z-50">
              <Popover>
                <PopoverTrigger asChild>
                  <Button className="w-full rounded-none rounded-t-lg h-14 text-lg">View Action Context</Button>
                </PopoverTrigger>
                <PopoverContent className="w-screen max-w-full h-[80vh] p-4">
                  {renderDynamicContent()}
                </PopoverContent>
              </Popover>
            </div>
          )}
        </form>
      </main>
    </div>
  );
}
