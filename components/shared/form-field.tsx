import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface LabelProps {
  children: ReactNode;
  required?: boolean;
  className?: string;
}

export function FormLabel({ children, required, className }: LabelProps) {
  return (
    <div
      className={cn(
        "mb-2 flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.6px] text-muted-foreground font-medium",
        className
      )}
    >
      {children}
      {required && <span className="text-primary">*</span>}
    </div>
  );
}

interface FormFieldProps {
  label: string;
  required?: boolean;
  children: ReactNode;
  half?: boolean;
  className?: string;
}

export function FormField({ label, required, children, half, className }: FormFieldProps) {
  return (
    <div className={cn("mb-3.5", half ? "col-span-1" : "col-span-2", className)}>
      <FormLabel required={required}>{label}</FormLabel>
      {children}
    </div>
  );
}
