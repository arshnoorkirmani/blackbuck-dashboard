export function StepBadge({ num, title }: { num: string | number; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <div className="flex size-7 items-center justify-center rounded-md border border-primary/20 bg-primary/10 font-mono text-[11px] font-medium text-primary">
        {num}
      </div>
      <span className="font-heading text-[15px] font-bold tracking-tight text-foreground">
        {title}
      </span>
    </div>
  );
}
