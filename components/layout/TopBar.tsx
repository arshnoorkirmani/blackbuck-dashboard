"use client";

import { Truck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopBarProps {
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  return (
    <div className="flex md:hidden items-center gap-3 h-[52px] border-b border-border bg-card px-4 shrink-0">
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        aria-label="Open navigation menu"
        className="text-muted-foreground hover:text-foreground hover:bg-muted"
      >
        {/* Hamburger icon — inline so we avoid importing Menu from lucide twice */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={18}
          height={18}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="18" x2="20" y2="18" />
        </svg>
      </Button>

      <div className="flex items-center gap-2">
        <div className="flex size-[26px] items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Truck strokeWidth={2.5} size={13} />
        </div>
        <span className="font-heading font-bold text-sm">BlackBuck</span>
      </div>
    </div>
  );
}
